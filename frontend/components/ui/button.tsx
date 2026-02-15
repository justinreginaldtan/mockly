import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#94A3B8] focus-visible:ring-offset-2 focus-visible:ring-offset-white relative overflow-hidden",
  {
    variants: {
      variant: {
        default:
          'bg-[#FF6F65] text-white shadow-[0_2px_20px_rgba(0,0,0,0.08)] hover:bg-[#ff6157] hover:shadow-[0_4px_28px_rgba(0,0,0,0.12)] hover:scale-[1.02]',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border border-[#EDE5E0] bg-white text-[#1A1A1A] shadow-[0_2px_16px_rgba(0,0,0,0.04)] hover:bg-[#F6F0EB] hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] hover:scale-[1.01]',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm hover:shadow-md hover:scale-[1.01]',
        ghost: 'hover:bg-accent hover:text-accent-foreground hover:scale-[1.01] dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
        gradient: 'bg-gradient-to-r from-[#FF7A70] to-[#FF9F70] text-white hover:from-[#FF6B60] hover:to-[#FF8F60] shadow-lg hover:shadow-xl',
        'gradient-blue': 'bg-gradient-to-r from-[#6EC8FF] to-[#7ED2B8] text-white hover:from-[#5AB5F0] hover:to-[#6EC8FF] shadow-lg hover:shadow-xl',
      },
      size: {
        default: 'h-10 px-5 py-2.5 has-[>svg]:px-4',
        sm: 'h-9 rounded-lg gap-1.5 px-4 has-[>svg]:px-3',
        lg: 'h-12 rounded-xl px-7 has-[>svg]:px-5',
        xl: 'h-14 rounded-xl px-10 text-base',
        icon: 'size-10',
        'icon-sm': 'size-9',
        'icon-lg': 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

type NativeButtonProps = Omit<React.ComponentProps<'button'>, "onDrag" | "onDragStart" | "onDragEnd">

interface ButtonProps extends NativeButtonProps, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  ripple?: boolean
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  ripple = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const buttonContent = (
    <>
      {loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="mr-2"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
        </motion.div>
      )}
      <motion.span
        animate={loading ? { opacity: 0.7 } : { opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.span>
      {ripple && (
        <motion.div
          className="absolute inset-0 rounded-xl"
          initial={{ scale: 0, opacity: 0 }}
          whileTap={{
            scale: 2,
            opacity: [0, 0.3, 0],
            transition: { duration: 0.6 }
          }}
          style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)"
          }}
        />
      )}
    </>
  )

  if (asChild) {
    return (
      <Slot
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {buttonContent}
      </Slot>
    )
  }

  return (
    <button
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {buttonContent}
    </button>
  )
}

export { Button, buttonVariants }
