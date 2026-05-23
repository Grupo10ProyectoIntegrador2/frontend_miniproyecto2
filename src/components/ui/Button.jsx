import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const Button = forwardRef(function Button(
  { className, variant = 'default', size = 'default', asChild = false, children, ...props },
  ref
) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-border bg-background hover:bg-secondary hover:text-secondary-foreground',
    ghost: 'hover:bg-secondary hover:text-secondary-foreground',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    link: 'text-primary underline-offset-4 hover:underline',
  }

  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-12 rounded-lg px-8 text-base',
    icon: 'h-10 w-10',
  }

  const variantStyles = variants[variant] || variants.default
  const sizeStyles = sizes[size] || sizes.default

  if (asChild && children) {
    const child = children
    return (
      <child.type
        ref={ref}
        {...child.props}
        className={cn(baseStyles, variantStyles, sizeStyles, className, child.props.className)}
        {...props}
      />
    )
  }

  return (
    <button
      ref={ref}
      className={cn(baseStyles, variantStyles, sizeStyles, className)}
      {...props}
    >
      {children}
    </button>
  )
})

export default Button
