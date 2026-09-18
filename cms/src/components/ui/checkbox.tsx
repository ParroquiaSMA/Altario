import * as React from "react"
import { cn } from "@/lib/utils"
import { CheckIcon, MinusIcon } from "lucide-react"

export interface CheckboxProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean
  indeterminate?: boolean
  onCheckedChange?: (checked: boolean) => void
}

export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  (
    {
      checked = false,
      indeterminate = false,
      onCheckedChange,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        role="checkbox"
        aria-checked={indeterminate ? "mixed" : checked}
        disabled={disabled}
        onClick={(e) => {
          props.onClick?.(e)
          if (!e.defaultPrevented) {
            onCheckedChange?.(!checked)
          }
        }}
        onKeyDown={(e) => {
          props.onKeyDown?.(e)
          if (e.key === " " && !e.defaultPrevented) {
            e.preventDefault()
            onCheckedChange?.(!checked)
          }
        }}
        className={cn(
          "peer inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input shadow-xs transition-colors outline-none cursor-pointer",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          checked || indeterminate
            ? "border-primary bg-primary text-primary-foreground"
            : "bg-background hover:bg-muted/50",
          className
        )}
        {...props}
      >
        {indeterminate ? (
          <MinusIcon className="size-3 stroke-[3]" />
        ) : checked ? (
          <CheckIcon className="size-3 stroke-[3]" />
        ) : null}
      </button>
    )
  }
)

Checkbox.displayName = "Checkbox"
