// TODO: implement
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function Input({ label, error, ...props }: InputProps) {
  return null;
}
