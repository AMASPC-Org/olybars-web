import { twMerge } from 'tailwind-merge';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  variant?: 'default' | 'outline' | 'buzzing' | 'chill' | 'mellow' | 'packed';
}

function Badge({ className, variant = 'default', label, ...props }: BadgeProps) {
  const variantClasses = {
    default: 'bg-slate-700 text-slate-100',
    outline: 'border border-slate-600 text-slate-300',
    buzzing: 'bg-red-500/20 text-red-100 border-[1.5px] border-primary shadow-[0_0_8px_rgba(251,191,36,0.3)]',
    chill: 'bg-blue-500/20 text-blue-100 border-[1.5px] border-primary shadow-[0_0_8px_rgba(251,191,36,0.3)]',
    mellow: 'bg-slate-800/40 text-slate-100 border-[1.5px] border-slate-700 shadow-[0_0_8px_rgba(148,163,184,0.1)]',
    packed: 'bg-pink-500/20 text-pink-100 border-[1.5px] border-primary shadow-[0_0_8px_rgba(251,191,36,0.3)]',
  };

  const classes = twMerge(
    'inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold',
    variantClasses[variant],
    className
  );

  return (
    <div className={classes} {...props}>
      {label}
    </div>
  );
}

export { Badge };
