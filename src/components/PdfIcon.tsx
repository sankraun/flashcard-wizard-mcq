import * as React from "react";

const PdfIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width={20}
    height={20}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect width="20" height="20" rx="4" fill="#E53935" />
    <path
      d="M6.5 7.5h7v5h-7v-5zm.75 1.25v2.5h5.5v-2.5h-5.5zm1.25 1.25h3v1h-3v-1z"
      fill="#fff"
    />
    <text x="3" y="17" fontSize="6" fill="#fff" fontFamily="Arial" fontWeight="bold">PDF</text>
  </svg>
);

export default PdfIcon;
