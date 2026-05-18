import type { SVGProps } from 'react'

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 0.9 21.2 3.2v8.3c0 5.3-3.5 8.2-9.2 10.8-5.6-2.1-9.2-5-9.2-10.8V3.2z" />
      <path d="m7 8 5 8 5-8" />
    </svg>
  )
}
