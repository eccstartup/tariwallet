import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { templatesCatalogue, templatesGet } from "@/services/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { EmptyState } from "@/components/EmptyState";
import { rpcRequest } from "@/services/jsonrpc";
import { useAccountsGetDefault } from "@/hooks/useAccounts";
import type { TemplateDetail, TemplateFunction, TemplateFunctionArg } from "@/services/types";

// CBOR encoding helpers for template args
// Tari uses CBOR-encoded values as hex strings for Literal args.
// Supported: Amount (u64), String (text), and byte-like types (ResourceAddress, Hash, PublicKey, Bucket, etc.)

function encodeU64(n: number): string {
  if (n <= 23) return n.toString(16).padStart(2, "0");
  if (n <= 0xff) return "18" + n.toString(16).padStart(2, "0");
  if (n <= 0xffff) return "19" + n.toString(16).padStart(4, "0");
  if (n <= 0xffffffff) return "1a" + (n >>> 0).toString(16).padStart(8, "0");
  const big = BigInt(Math.floor(n));
  return "1b" + big.toString(16).padStart(16, "0");
}

// CBOR decoders for return values
interface CborValue {
  hex: string;
  tag?: number;
}

function extractResultValue(execResult: any): any {
  if (!execResult) return null;
  const indexed = execResult.indexed;
  if (!indexed) return null;
  const inner = indexed.indexed;
  if (!inner) return null;
  const val = inner.value;
  if (val === undefined || val === null) return null;
  return val;
}

function decodeCborU64(hex: string): bigint {
  const first = parseInt(hex.substring(0, 2), 16);
  if (first <= 23) return BigInt(first);
  if (first === 0x18) return BigInt("0x" + hex.substring(2, 4));
  if (first === 0x19) return BigInt("0x" + hex.substring(2, 6));
  if (first === 0x1a) return BigInt("0x" + hex.substring(2, 10));
  if (first === 0x1b) return BigInt("0x" + hex.substring(2, 18));
  return BigInt(0);
}

function decodeCborBytes(hex: string): string {
  const first = parseInt(hex.substring(0, 2), 16);
  let offset = 2;
  let len = 0;
  if (first >= 0x40 && first <= 0x57) { len = first - 0x40; }
  else if (first === 0x58) { len = parseInt(hex.substring(2, 4), 16); offset = 4; }
  else if (first === 0x59) { len = parseInt(hex.substring(2, 6), 16); offset = 6; }
  return hex.substring(offset, offset + len * 2);
}

function formatReturnValue(raw: any, returnType: string): string {
  if (raw === null || raw === undefined) return "(empty)";

  // Amount returns a number or [amount, _] array
  if (returnType === "Amount") {
    if (Array.isArray(raw)) return raw[0].toString();
    return String(raw);
  }

  // Unit (void) return
  if (returnType === "()" || returnType === "Unit") return "ok";

  // Component<T> returns tagged bytes: hex string → "component_" + hex
  if (returnType.includes("Component")) {
    return "component_" + raw;
  }

  // ResourceAddress returns tagged bytes
  if (returnType === "ResourceAddress") {
    return "resource_" + raw;
  }

  // Bucket returns tagged bytes
  if (returnType === "Bucket") {
    return raw;
  }

  // Unknown: show as JSON
  try { return JSON.stringify(raw); } catch { return String(raw); }
}

function encodeString(s: string): string {
  const bytes = new TextEncoder().encode(s);
  const len = bytes.length;
  const body = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
  if (len <= 23) return (0x60 + len).toString(16).padStart(2, "0") + body;
  if (len <= 0xff) return "78" + len.toString(16).padStart(2, "0") + body;
  return "79" + len.toString(16).padStart(4, "0") + body;
}

function encodeBytes(hexStr: string): string {
  // CBOR byte string (major type 2)
  // Strip common Tari prefixes: resource_, component_, vault_, 0x
  let hex = hexStr.replace(/^0x/, "");
  const prefixes = ["resource_", "component_", "vault_", "template_", "public_key_", "nft_"];
  for (const p of prefixes) {
    if (hex.startsWith(p)) { hex = hex.slice(p.length); break; }
  }
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    const b = parseInt(hex.substring(i, i + 2), 16);
    if (isNaN(b)) return "";  // invalid hex
    bytes.push(b);
  }
  const len = bytes.length;
  const body = bytes.map(b => b.toString(16).padStart(2, "0")).join("");
  if (len <= 23) return (0x40 + len).toString(16).padStart(2, "0") + body;
  if (len <= 0xff) return "58" + len.toString(16).padStart(2, "0") + body;
  return "59" + len.toString(16).padStart(4, "0") + body;
}

function encodeArg(typeName: string, value: string): string {
  switch (typeName) {
    case "Amount":
      return encodeU64(Number(value));
    case "String":
      return encodeString(value);
    default:
      // ResourceAddress, PublicKey, Hash, Bucket, NonFungibleAddress, Metadata, etc.
      return encodeBytes(value);
  }
}

// CBOR array [max_fee, 0] for the pay_fee method arg
function encodeFeeArg(fee: number): string {
  return "82" + encodeU64(fee) + "00";
}

function argTypeName(t: string | { Other: { name: string } }): string {
  return typeof t === "string" ? t : t.Other.name;
}

function outputTypeName(t: string | { Other: { name: string } }): string {
  if (typeof t === "string") return t;
  if (t === "Unit") return "()";
  return t.Other.name;
}

function isSelfArg(arg: TemplateFunctionArg): boolean {
  const name = argTypeName(arg.arg_type);
  return name === "&self" || name === "&mut self";
}

function needsComponentAddress(args: TemplateFunctionArg[]): boolean {
  return args.some(a => isSelfArg(a));
}

interface FunctionCallState {
  args: Record<string, string>;
  result: string | null;
  loading: boolean;
}

function FunctionCallForm({
  func,
  templateAddress,
  feeAccount,
}: {
  func: TemplateFunction;
  templateAddress: string;
  feeAccount: string;
}) {
  const userArgs = func.arguments.filter(a => !isSelfArg(a));
  const hasSelf = needsComponentAddress(func.arguments);
  const defaultFee = func.is_mut ? "1000000" : "100000";
  const [state, setState] = useState<FunctionCallState>({
    args: { _fee: defaultFee },
    result: null,
    loading: false,
  });

  const handleCall = async () => {
    setState(s => ({ ...s, loading: true, result: null }));
    try {
      const hasSelf = needsComponentAddress(func.arguments);
      const selfArg = func.arguments.find(a => isSelfArg(a));
      const encodedArgs = func.arguments
        .filter(a => !isSelfArg(a))
        .map((arg) => ({
          Literal: encodeArg(argTypeName(arg.arg_type), state.args[arg.name] || ""),
        }));

      const instruction = hasSelf
        ? {
            CallMethod: {
              call: { Address: state.args[selfArg!.name] || "" },
              method: func.name,
              args: encodedArgs,
            },
          }
        : {
            CallFunction: {
              template_address: templateAddress,
              address: templateAddress,
              function: func.name,
              args: encodedArgs,
            },
          };

      const isDryRun = false; // Always real execution — Tari has no free reads

      const data = await rpcRequest("transactions.submit", {
        seal_signer: { Derived: { index: 0, key_branch: "account" } },
        other_signers: [],
        is_seal_signer_authorized: true,
        lock_ids: [],
        fee_account: { ComponentAddress: feeAccount },
        max_fee: Number(state.args["_fee"] || "1000000"),
        dry_run: isDryRun,
        detect_inputs: true,
        transaction: {
          V1: {
            network: 38,
            is_seal_signer_authorized: true,
            inputs: [],
            instructions: [instruction],
            fee_instructions: [
              {
                CallMethod: {
                  call: { Address: feeAccount },
                  method: "pay_fee",
                  args: [{ Literal: encodeFeeArg(Number(state.args["_fee"] || "1000000")) }],
                },
              },
            ],
            dry_run: false,
          },
        },
      }) as any;
      const txid = data.transaction_id as string;
      const retType = outputTypeName(func.output);

      if (isDryRun) {
        setState(s => ({ ...s, result: `🔍 Dry run: ${txid}`, loading: false }));
        return;
      }

      // Wait for confirmation and display ALL return values
      setState(s => ({ ...s, result: `⏳ ${txid.slice(0, 10)}...`, loading: true }));
      let attempts = 0;
      while (attempts < 15) {
        await new Promise(r => setTimeout(r, 2000));
        attempts++;
        try {
          const txResult = await rpcRequest("transactions.get_result", { transaction_id: txid }) as any;
          const inner = txResult?.result;
          if (!inner) continue;

          // Handle rejection
          if (inner.result && typeof inner.result === "object" && "Reject" in (inner.result as any)) {
            setState(s => ({ ...s, result: `❌ ${JSON.stringify((inner.result as any).Reject)}`, loading: false }));
            return;
          }

          // Extract return values
          const allResults = inner.execution_results;
          if (!allResults || allResults.length === 0) continue;

          const lines: string[] = [];
          for (let i = 0; i < allResults.length; i++) {
            const exec: any = allResults[i];
            let rt = "?";
            if (exec && exec.return_type && exec.return_type.Other) {
              rt = exec.return_type.Other.name || "?";
            }
            let display = "(empty)";
            if (exec && exec.indexed && exec.indexed.value !== undefined && exec.indexed.value !== null) {
              display = JSON.stringify(exec.indexed.value);
            }
            lines.push(rt + ": " + display);
          }
          setState(s => ({ ...s, result: "✅ " + lines.join(" | "), loading: false }));
          return;
        } catch {
          // retry
        }
      }
      setState(s => ({ ...s, result: `⚠️ Timed out: ${txid}`, loading: false }));
    } catch (err: any) {
      setState(s => ({ ...s, result: `❌ ${err.message}`, loading: false }));
    }
  };

  const allFilled = userArgs.every(a => state.args[a.name]?.trim()) && (!hasSelf || state.args["self"]?.trim());

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${func.is_mut ? "bg-orange-500/10 text-orange-400" : "bg-blue-500/10 text-blue-400"}`}>
          {func.is_mut ? "mut" : "read"}
        </span>
        <span className="font-mono font-semibold text-gray-900 dark:text-white">{func.name}</span>
        <span className="text-gray-400 dark:text-gray-400">→</span>
        <span className="font-mono text-green-400">{outputTypeName(func.output)}</span>
      </div>
      {func.arguments.length > 0 && (
        <div className="space-y-1.5">
          {func.arguments.map((arg) => (
            <div key={arg.name}>
              <label className="text-xs text-gray-500 dark:text-gray-400">
                {isSelfArg(arg) ? "Component" : arg.name} <span className="text-gray-400 dark:text-gray-400">({argTypeName(arg.arg_type)})</span>
              </label>
              <input
                type="text"
                value={state.args[arg.name] || ""}
                onChange={(e) => setState(s => ({ ...s, args: { ...s.args, [arg.name]: e.target.value } }))}
                placeholder={isSelfArg(arg) ? "From mint result above" : argTypeName(arg.arg_type) === "String" ? arg.name : argTypeName(arg.arg_type) === "Amount" ? arg.name : `${arg.name} (hex)`}
                className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-xs font-mono text-gray-900 dark:text-gray-100"
              />
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">Max Fee (µTARI)</label>
            <input
              type="number"
              value={state.args["_fee"] || "1000000"}
              onChange={(e) => setState(s => ({ ...s, args: { ...s.args, _fee: e.target.value } }))}
              className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-xs font-mono text-gray-900 dark:text-gray-100"
            />
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
              {func.is_mut ? "Mutating — needs fee" : "Read-only — minimal fee"}
            </p>
          </div>
        </div>
      )}
      <button
        onClick={handleCall}
        disabled={state.loading || !allFilled}
        className="px-3 py-1.5 text-xs font-medium bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 transition-colors"
      >
        {state.loading ? "Calling..." : "Call"}
      </button>
      {state.result && (
        <p className={`text-xs break-all ${state.result.startsWith("❌") ? "text-red-400" : "text-green-400"}`}>
          {state.result}
        </p>
      )}
    </div>
  );
}

function TemplateDetailCard({ template, address }: { template: TemplateDetail; address?: string }) {
  const { data: defaultAccount } = useAccountsGetDefault();
  const feeAccount = defaultAccount?.account?.component_address || "";
  const tplAddress = address || template.address || "";

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white">{template.name}</h3>
        {tplAddress && <p className="text-xs text-gray-400 dark:text-gray-400 font-mono mt-1 truncate">{tplAddress}</p>}
        <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">Code size: {template.code_size.toLocaleString()} bytes</p>
      </div>

      {template.functions && template.functions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Functions</h4>
          {template.functions.map((func) => (
            <FunctionCallForm
              key={func.name}
              func={func}
              templateAddress={tplAddress}
              feeAccount={feeAccount}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Templates() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [lookupAddr, setLookupAddr] = useState("");
  const [publishMode, setPublishMode] = useState(false);
  const [wasmBase64, setWasmBase64] = useState("");
  const [publishFee, setPublishFee] = useState("1000000");
  const [publishResult, setPublishResult] = useState<string | null>(null);
  const qc = useQueryClient();
  const { data: defaultAccount } = useAccountsGetDefault();
  const feeAccount = defaultAccount?.account?.component_address || "";

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["templates"],
    queryFn: () => templatesCatalogue(0, 50),
  });

  const { data: templateDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ["templates", selectedTemplate],
    queryFn: () => templatesGet(selectedTemplate!),
    enabled: !!selectedTemplate,
  });

  const { data: lookedUpTemplate, isFetching: lookingUp } = useQuery({
    queryKey: ["templates", "lookup", lookupAddr],
    queryFn: () => templatesGet(lookupAddr),
    enabled: lookupAddr.length > 10,
  });

  const publishMutation = useMutation({
    mutationFn: () =>
      rpcRequest("transactions.publish_template", {
        fee_account: { ComponentAddress: feeAccount },
        binary: wasmBase64,
        max_fee: Number(publishFee),
        detect_inputs: true,
        dry_run: false,
      }),
    onSuccess: (data: any) => {
      setPublishResult(`Published! Transaction ID: ${data.transaction_id}`);
      qc.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: (err: any) => {
      setPublishResult(`Error: ${err.message}`);
    },
  });

  const templates = data?.templates || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Templates</h1>
        <button
          onClick={() => setPublishMode(!publishMode)}
          className="px-4 py-2 text-sm font-medium bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          {publishMode ? "← Browse" : "+ Publish Template"}
        </button>
      </div>

      {/* Publish Form */}
      {publishMode && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Publish New Template</h3>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">
              WASM Template File
            </label>
            <input
              type="file"
              accept=".wasm"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  const result = reader.result as string;
                  const base64 = result.split(",")[1];
                  setWasmBase64(base64);
                };
                reader.readAsDataURL(file);
              }}
              className="w-full text-sm text-gray-700 dark:text-gray-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-500 file:text-white hover:file:bg-purple-600 file:cursor-pointer"
            />
            {wasmBase64 && (
              <p className="text-xs text-green-400 mt-1">File loaded ({Math.round(wasmBase64.length * 0.75)} bytes)</p>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">
              Max Fee (µTARI)
            </label>
            <input type="number" value={publishFee} onChange={(e) => setPublishFee(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100" />
            <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">Depends on WASM size. Daemon will charge actual cost up to this limit.</p>
          </div>
          <button
            onClick={() => publishMutation.mutate()}
            disabled={publishMutation.isPending || !wasmBase64 || !publishFee}
            className="px-4 py-2 text-sm font-medium bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
          >
            {publishMutation.isPending ? "Publishing..." : "Publish"}
          </button>
          {publishResult && (
            <p className={`text-xs ${publishResult.startsWith("Error") ? "text-red-400" : "text-green-400"}`}>
              {publishResult}
            </p>
          )}
        </div>
      )}

      {/* Lookup */}
      <div className="flex gap-3">
        <input
          type="text"
          value={lookupAddr}
          onChange={(e) => setLookupAddr(e.target.value)}
          placeholder="Lookup template by address..."
          className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
      </div>
      {lookingUp && <LoadingSpinner text="Looking up template..." />}
      {lookedUpTemplate?.template && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <TemplateDetailCard template={lookedUpTemplate.template} address={lookupAddr} />
        </div>
      )}

      {/* Template List */}
      {isLoading ? (
        <LoadingSpinner text="Loading templates..." />
      ) : error ? (
        <ErrorDisplay message="Failed to load templates" onRetry={() => refetch()} />
      ) : templates.length === 0 ? (
        <EmptyState
          icon="⊡"
          title="No Templates Published"
          description="No templates have been published on this network yet. Use 'Publish Template' to publish one, or look up an existing template by address."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            {templates.map((tpl) => (
              <button
                key={tpl.address}
                onClick={() => setSelectedTemplate(tpl.address)}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  selectedTemplate === tpl.address
                    ? "bg-purple-50 dark:bg-purple-500/10 border-purple-300 dark:border-purple-700"
                    : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-purple-200 dark:hover:border-purple-700"
                }`}
              >
                <p className="font-medium text-gray-900 dark:text-white">{tpl.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-400 mt-1 font-mono truncate">{tpl.address}</p>
                {tpl.abi_version !== undefined && <span className="text-xs text-gray-400 dark:text-gray-400 mt-1">ABI v{tpl.abi_version}</span>}
              </button>
            ))}
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
            {!selectedTemplate ? (
              <p className="text-sm text-gray-400 dark:text-gray-400 text-center py-8">Select a template to view details</p>
            ) : loadingDetail ? (
              <LoadingSpinner text="Loading template..." />
            ) : templateDetail?.template ? (
              <TemplateDetailCard template={templateDetail.template} address={selectedTemplate} />
            ) : (
              <ErrorDisplay message="Template not found" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
