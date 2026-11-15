import {Client,GatewayIntentBits,SlashCommandBuilder,REST,Routes,MessageFlags} from 'discord.js';
import {CinemaWorld} from './core.mjs';
import {Ledger} from './ledger.mjs';
import {resolve} from 'node:path';
const required=['DISCORD_BOT_TOKEN','DISCORD_APP_ID','DISCORD_GUILD_ID'];
for(const key of required)if(!process.env[key])throw Error('missing_env_'+key);
const ledger=new Ledger(resolve(process.env.THEATER_LEDGER||'./theater-events.jsonl'));
if(ledger.read().length)throw Error('ledger_replay_unimplemented_fail_closed');
const world=new CinemaWorld({id:process.env.THEATER_WORLD||'theater-genesis',append:e=>ledger.append(e)});
const commands=[
 new SlashCommandBuilder().setName('world').setDescription('Inspect the theater universe'),
 new SlashCommandBuilder().setName('screening').setDescription('Show approved productions'),
 new SlashCommandBuilder().setName('contribute').setDescription('Offer material for private creative review').addStringOption(o=>o.setName('text').setDescription('Text contribution; you must own or have permission to submit it').setRequired(true).setMaxLength(5000))
].map(c=>c.toJSON());
const rest=new REST({version:'10'}).setToken(process.env.DISCORD_BOT_TOKEN);
await rest.put(Routes.applicationGuildCommands(process.env.DISCORD_APP_ID,process.env.DISCORD_GUILD_ID),{body:commands});
const bot=new Client({intents:[GatewayIntentBits.Guilds]});
bot.on('interactionCreate',async interaction=>{
 if(!interaction.isChatInputCommand()||!interaction.inGuild()||interaction.guildId!==process.env.DISCORD_GUILD_ID)return;
 try{
  if(interaction.commandName==='world')return await interaction.reply({content:'World: '+world.id+' | Approved scenes: '+world.canon.size,flags:MessageFlags.Ephemeral});
  if(interaction.commandName==='screening')return await interaction.reply({content:'Approved productions: '+[...world.jobs.values()].filter(x=>x.status==='published').length,flags:MessageFlags.Ephemeral});
  if(interaction.commandName==='contribute'){
   const r=world.contribute({actor:interaction.user.id,role:'audience',text:interaction.options.getString('text'),consent:true,source:'discord'});
   return await interaction.reply({content:'Source held for private editorial review. Receipt: '+r.id+'. Not licensed for publication.',flags:MessageFlags.Ephemeral});
  }
 }catch(e){await interaction.reply({content:'Request refused: '+e.message,flags:MessageFlags.Ephemeral});}
});
await bot.login(process.env.DISCORD_BOT_TOKEN);
console.log('THEATER intake bot connected; no wallet/mint/render/posting enabled.');
