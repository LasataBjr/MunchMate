import logo from '../../assets/images/logo.jpg'
import { siteInfo } from '../../config/site'

type LogoProps = {
  // Height of the picture. The text scales with it through the font size below.
  className?: string
  // "light" is for sitting on the red panel, where red "24" would disappear
  tone?: 'default' | 'light'
  textClassName?: string
}

// "Grab24" becomes "Grab" + "24". A name without trailing digits is shown as it is.
function splitName(name: string): [string, string] {
  const match = name.match(/^(.*?)(\d+)$/)
  return match ? [match[1], match[2]] : [name, '']
}

export default function Logo({
  className = 'h-9',
  tone = 'default',
  textClassName = 'text-xl',
}: LogoProps) {
  const [word, number] = splitName(siteInfo.name)
  const onRed = tone === 'light'

  return (
    <span className="inline-flex items-center gap-2.5">
      {/* The name is written next to the picture, so the picture is decorative */}
      <img
        src={logo}
        alt=""
        className={`w-auto rounded-md ${onRed ? '' : 'dark:ring-1 dark:ring-line'} ${className}`}
      />
      <span
        className={`font-extrabold leading-none tracking-tight ${textClassName} ${
          onRed ? 'text-white' : 'text-fg'
        }`}
      >
        {word}
        {number && <span className={onRed ? 'text-white/70' : 'text-accent'}>{number}</span>}
      </span>
    </span>
  )
}