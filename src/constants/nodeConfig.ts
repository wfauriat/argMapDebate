import { NodeType } from "@/types/nodes";

export interface NodeTypeConfig {
  label: string;
  color: string;       // Tailwind border/accent color
  bgColor: string;     // Tailwind bg color for header
  textColor: string;   // Tailwind text color for header
  icon: string;        // Emoji icon
}

export const NODE_TYPE_CONFIG: Record<NodeType, NodeTypeConfig> = {
  [NodeType.FactualClaim]: {
    label: "Factual Claim",
    color: "border-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950",
    textColor: "text-blue-700 dark:text-blue-300",
    icon: "📋",
  },
  [NodeType.CausalClaim]: {
    label: "Causal Claim",
    color: "border-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950",
    textColor: "text-purple-700 dark:text-purple-300",
    icon: "🔗",
  },
  [NodeType.Value]: {
    label: "Value",
    color: "border-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-950",
    textColor: "text-orange-700 dark:text-orange-300",
    icon: "⚖️",
  },
  [NodeType.Assumption]: {
    label: "Assumption",
    color: "border-gray-500",
    bgColor: "bg-gray-50 dark:bg-gray-700",
    textColor: "text-gray-700 dark:text-gray-300",
    icon: "💭",
  },
  [NodeType.Evidence]: {
    label: "Evidence",
    color: "border-teal-500",
    bgColor: "bg-teal-50 dark:bg-teal-950",
    textColor: "text-teal-700 dark:text-teal-300",
    icon: "📊",
  },
  [NodeType.Policy]: {
    label: "Policy",
    color: "border-green-500",
    bgColor: "bg-green-50 dark:bg-green-950",
    textColor: "text-green-700 dark:text-green-300",
    icon: "📜",
  },
};
