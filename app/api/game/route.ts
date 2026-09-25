import { env } from 'cloudflare:workers';
import { AVATARS, DEFAULT_AVATAR } from '@/lib/avatars';
import { moreQuestions, shuffledQuestionOrder } from '@/lib/more-questions';
import { bonusChallenges } from '@/lib/bonus-challenges';
export const runtime = 'edge';
type Player={id:string;token:string;name:string;score:number;avatar?:string};
type Game={code:string;host:string;players:Player[];phase:'lobby'|'answer'|'guess'|'reveal'|'choice'|'mini'|'finished';round:number;totalRounds?:number;roundsPerPlayer?:number;question:number;questionOrder?:number[];answer:number|null;guesses:Record<string,number>;earned:Record<string,number>;winner:string|null;chosen:string|null;miniKind:'puzzle'|'object'|null;miniIndex:number;miniDone:boolean;miniOrder?:number[];miniCursor?:number;miniQuestion?:number;miniOptionsOrder?:number[];miniStartAt?:number;miniAnswers?:Record<string,number>;miniWinner?:string|null};
const QUESTIONS=[
 {q:'Your Saturday plans got canceled. What is your backup plan?',a:['A road trip with zero planning','Become one with the couch','Find friends and a giant meal','Start a hobby I may abandon']},
 {q:'Pick a superpower. No, you cannot have all four.',a:['Teleport before anyone says “traffic”','Read minds (risky, I know)','Pause time for five more minutes','Ask animals what they think of me']},
 {q:'A free plane ticket appears. Where are you escaping to?',a:['A beach and zero emails','A cabin in the mountains','A city that never sleeps','Somewhere full of history']},
 {q:'Your friends plan a movie heist. What is your role?',a:['I have the whole plan','I talk us past security','I drive the getaway car','I trip into the plot somehow']},
 {q:'Stranded on an island: what is in your suitcase?',a:['Books (so many books)','A sensible survival kit','My favorite person','A solar charger and my phone']},
 {q:'Your friends throw you a surprise party. Your reaction?',a:['Turn the music ALL the way up','A small dinner, please','Take the party outdoors','Who told you I like surprises?']},
 {q:'Which little thing instantly fixes a bad day?',a:['Coffee nobody interrupts','Fresh sheets: instant royalty','A shower that lasts forever','A midnight snack']},
 {q:'You are on vacation. What is the plan?',a:['An itinerary with backup plans','Walk until something looks fun','Sleep like it is my job','Let the snacks choose the route']},
 {q:'You can master one skill overnight. Pick your flex.',a:['Play an instrument like a star','Speak every language','Cook literally anything','Dance like nobody is recording']},
 {q:'Your friends call you at 2 a.m. Why?',a:['They need advice','They have a wild last-minute plan','Something broke and I can fix it','They need a laugh']},
 {q:'Where do you disappear to at a party?',a:['DJ booth (self-appointed)','A deep conversation in the corner','The unofficial comedy stage','Near the snacks, obviously']},
 {q:'What song plays when you enter a room?',a:['An epic movie soundtrack','A loud pop anthem','A cozy acoustic tune','Dramatic rock, with wind machine']},
  ...moreQuestions.map(({en}) => en),
];
const uid=()=>crypto.randomUUID();
const code=()=>Array.from(crypto.getRandomValues(new Uint8Array(5))).map(x=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[x%32]).join('');
const db=()=>{if(!env.DB)throw new Error('Room storage unavailable');return env.DB};
const roundLimit=(g:Game)=>g.totalRounds??(g.phase==='lobby'?g.roundsPerPlayer??2:g.players.length*(g.roundsPerPlayer??2));
const publicBonus=(g:Game)=>{if(g.phase!=='mini')return null;const challenge=bonusChallenges[g.miniQuestion??(g.miniKind==='object'?14:0)];return challenge.kind==='quiz'?{kind:challenge.kind,prompt:challenge.prompt,answers:challenge.answers}:{kind:challenge.kind,prompt:challenge.prompt,target:challenge.target,fillers:challenge.fillers}};
const response=(g:Game,id:string)=>({code:g.code,host:g.host,players:g.players.map(({id,name,score,avatar})=>({id,name,score,avatar:avatar??DEFAULT_AVATAR})),phase:g.phase,round:g.round,total:roundLimit(g),spotlight:g.players[g.round%g.players.length]?.id,question:QUESTIONS[g.question],answer:g.phase==='reveal'||g.phase==='choice'||g.phase==='mini'||g.phase==='finished'?g.answer:null,hasAnswered:g.answer!==null,guessed:Object.keys(g.guesses),myGuess:g.guesses[id]??null,earned:g.earned,winner:g.winner,chosen:g.chosen,miniKind:g.miniKind,miniIndex:g.phase==='mini'?g.miniIndex:null,miniChallenge:publicBonus(g),miniOptionsOrder:g.miniOptionsOrder??[0,1,2,3],miniStartAt:g.miniStartAt??0,miniAnswered:Object.keys(g.miniAnswers??{}),miniWinner:g.miniWinner??null,miniDone:g.miniDone,serverTime:Date.now()});
const fail=(message:string,status=400)=>Response.json({error:message},{status});
const load=async(c:string)=>{const row=await db().prepare('SELECT state,version FROM rooms WHERE code = ?').bind(c).first<{state:string;version:number}>();return row?{g:JSON.parse(row.state) as Game,version:row.version}:null};
export async function GET(req:Request){try{const u=new URL(req.url),c=(u.searchParams.get('code')||'').toUpperCase(),t=u.searchParams.get('token');const r=await load(c);if(!r)return fail('Room not found',404);const p=r.g.players.find(p=>p.token===t);if(!p)return fail('Your session is no longer in this room',403);return Response.json({game:response(r.g,p.id),me:p.id})}catch(e){console.error(e);return fail('Could not load the room',500)}}
export async function POST(req:Request){try{const b=await req.json() as Record<string,unknown>;const action=String(b.action||'');const name=String(b.name||'').trim().slice(0,24);const avatar=AVATARS.includes(String(b.avatar) as (typeof AVATARS)[number])?String(b.avatar):DEFAULT_AVATAR;if(action==='create'){if(!name)return fail('Enter your name');for(let i=0;i<5;i++){const c=code(),p={id:uid(),token:uid(),name,score:0,avatar},questionOrder=shuffledQuestionOrder(QUESTIONS.length);const g:Game={code:c,host:p.id,players:[p],phase:'lobby',round:0,totalRounds:8,question:questionOrder[0],questionOrder,answer:null,guesses:{},earned:{},winner:null,chosen:null,miniKind:null,miniIndex:0,miniDone:false,miniOrder:shuffledQuestionOrder(bonusChallenges.length),miniCursor:0};try{await db().prepare('INSERT INTO rooms (code,state,version,updated_at) VALUES (?,?,0,?)').bind(c,JSON.stringify(g),Date.now()).run();return Response.json({code:c,token:p.token,me:p.id,game:response(g,p.id)})}catch{continue}}return fail('Could not create a room',500)}
const c=String(b.code||'').toUpperCase().trim(),token=String(b.token||'');for(let retry=0;retry<7;retry++){const row=await load(c);if(!row)return fail('Room not found',404);const g=row.g;let p=g.players.find(p=>p.token===token);if(action==='join'){if(p)return Response.json({code:c,token:p.token,me:p.id,game:response(g,p.id)});if(!name)return fail('Enter your name');if(g.phase!=='lobby')return fail('This game has already started');if(g.players.length>=8)return fail('Room is full');if(g.players.some(x=>x.name.toLowerCase()===name.toLowerCase()))return fail('That name is already taken');p={id:uid(),token:uid(),name,score:0,avatar};g.players.push(p)}else{if(!p)return fail('Your session is no longer in this room',403);
const spot=g.players[g.round%g.players.length];
if(action==='setRounds'){if(g.host!==p.id||g.phase!=='lobby')return fail('Only the host can set rounds before the game starts');const v=Number(b.value);if(!Number.isInteger(v)||v<1||v>20)return fail('Choose 1 to 20 total rounds');g.totalRounds=v}
else if(action==='start'){if(g.host!==p.id||g.phase!=='lobby')return fail('Only the host can start');if(g.players.length<2)return fail('Invite at least one friend');g.totalRounds??=g.roundsPerPlayer??2;g.phase='answer'}
else if(action==='answer'){if(g.phase!=='answer'||p.id!==spot.id)return fail('Wait for your spotlight turn');const v=Number(b.value);if(!Number.isInteger(v)||v<0||v>3)return fail('Choose an answer');g.answer=v;g.phase='guess'}
else if(action==='guess'){if(g.phase!=='guess'||p.id===spot.id||g.guesses[p.id]!==undefined)return fail('You cannot guess now');const v=Number(b.value);if(!Number.isInteger(v)||v<0||v>3)return fail('Choose an answer');g.guesses[p.id]=v;if(Object.keys(g.guesses).length===g.players.length-1){const fooledEveryone=Object.values(g.guesses).every(guess=>guess!==g.answer);for(const player of g.players){const earned=player.id===spot.id?(fooledEveryone?1:0):(g.guesses[player.id]===g.answer?2:0);g.earned[player.id]=earned;player.score+=earned}const top=Math.max(...Object.values(g.earned));const tied=g.players.filter(x=>g.earned[x.id]===top);g.winner=tied[Math.floor(Math.random()*tied.length)].id;const eligible=g.players.filter(x=>x.id!==g.winner);g.chosen=eligible[Math.floor(Math.random()*eligible.length)].id;g.phase='reveal'}}
else if(action==='revealNext'){if(g.phase!=='reveal')return fail('Wait for the reveal');g.phase='choice'}
else if(action==='choose'){if(g.phase!=='choice'||p.id!==g.chosen)return fail('It is someone else’s choice');if(b.value==='regular'){next(g)}else if(b.value==='mini'){
  if(!g.miniOrder||g.miniCursor===undefined||g.miniCursor>=g.miniOrder.length){const previous=g.miniQuestion;g.miniOrder=shuffledQuestionOrder(bonusChallenges.length);if(g.miniOrder[0]===previous)[g.miniOrder[0],g.miniOrder[1]]=[g.miniOrder[1],g.miniOrder[0]];g.miniCursor=0}
  g.miniQuestion=g.miniOrder[g.miniCursor++];const challenge=bonusChallenges[g.miniQuestion];g.miniKind=challenge.kind==='quiz'?'puzzle':'object';g.miniOptionsOrder=shuffledQuestionOrder(4);g.miniIndex=Math.floor(Math.random()*25);g.miniStartAt=Date.now()+5000;g.miniAnswers={};g.miniWinner=null;g.miniDone=false;g.phase='mini'
}else return fail('Choose a round')}
else if(action==='miniAnswer'){
  if(g.phase!=='mini')return fail('Wait for the bonus challenge');
  if(g.miniDone||g.miniAnswers?.[p.id]!==undefined)return Response.json({code:c,token:p.token,me:p.id,game:response(g,p.id)});
  if(Date.now()<(g.miniStartAt??0))return fail('The bonus challenge has not started yet');
  const value=Number(b.value),challenge=bonusChallenges[g.miniQuestion??(g.miniKind==='object'?14:0)];
  if(!Number.isInteger(value)||value<0||value>=(challenge.kind==='quiz'?4:25))return fail('Choose an answer');
  g.miniAnswers??={};g.miniAnswers[p.id]=value;
  const right=challenge.kind==='quiz'?value===challenge.correct:value===g.miniIndex;
  if(right){g.miniWinner=p.id;g.miniDone=true;p.score+=1;g.earned[p.id]=(g.earned[p.id]||0)+1}
  else if(Object.keys(g.miniAnswers).length===g.players.length)g.miniDone=true;
}
else if(action==='miniNext'){if(g.phase!=='mini'||!g.miniDone)return fail('Finish the mini-game first');next(g)}
else return fail('Unknown action')}
const updated=await db().prepare('UPDATE rooms SET state=?,version=version+1,updated_at=? WHERE code=? AND version=?').bind(JSON.stringify(g),Date.now(),c,row.version).run();if(updated.meta.changes===1)return Response.json({code:c,token:p?.token,me:p?.id,game:response(g,p!.id)})}
return fail('Room is busy, please retry',409)}catch(e){console.error(e);return fail('Something went wrong. Please try again.',500)}}
function next(g:Game){g.round++;if(g.round>=roundLimit(g)){g.phase='finished';return}g.question=g.questionOrder?.[g.round]??g.round%QUESTIONS.length;g.answer=null;g.guesses={};g.earned={};g.winner=null;g.chosen=null;g.miniKind=null;g.miniDone=false;g.phase='answer'}
