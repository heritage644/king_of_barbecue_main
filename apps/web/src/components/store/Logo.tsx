import Link from "next/link";
import Image from "next/image";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-3"
      aria-label="King of Barbecue home"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full  shadow-glow">
        <Image
          src="/Rectangle-624.svg"
          alt="King of Barbecue"
          width={44}
          height={44}
          priority
        />
      </span>
    </Link>
  );
}