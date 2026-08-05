import { Loader2 } from "lucide-react";

/**
 * Spinner — inline loading indicator.
 * @param {{size?:number, className?:string, label?:string}} props
 */
export default function Spinner({ size = 20, className = "", label }) {
  return (
    <span className={`inline-flex items-center gap-2 text-slate-muted ${className}`}>
      <Loader2 className="animate-spin" style={{ width: size, height: size }} />
      {label && <span className="text-sm">{label}</span>}
    </span>
  );
}
