import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'Inside Joke — Party Game',description:'A room-code game to discover how well you know your friends.',icons:{icon:'/favicon.svg'},openGraph:{title:'Inside Joke — Party Game',description:'How well do you really know your friends? Play together on your phones.',images:['/inside-joke-cover.webp']},twitter:{card:'summary_large_image',images:['/inside-joke-cover.webp']}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
