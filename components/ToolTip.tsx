type TooltipProps = {
    children: React.ReactNode
    text: string
  }
  
  export function Tooltip({ children, text }: TooltipProps) {
    return (
      <div className="relative group inline-block">
        {children}
        <div className={`absolute bottom-full mb-1 left-1/2 -translate-x-1/2 w-max max-w-xs bg-black text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 ${text === '' ? 'hidden' : 'block'}`}>
          {text}
        </div>
      </div>
    )
  }
  