import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'Inside Joke — Party Game',description:'A room-code game to discover how well you know your friends.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
