import createApp from 'https://deno.land/x/dropserver_app@v0.1.1/mod.ts';
import RoutesBuilder, {AuthAllow, Context} from 'https://deno.land/x/dropserver_app@v0.1.1/approutes.ts';
import MigrationsBuilder from 'https://deno.land/x/dropserver_app@v0.1.1/migrations.ts';

const m = new MigrationsBuilder;
// create a migration from schema 0 to 1:
m.upTo(1, async() => {
	//@ts-ignore because we want bomb
	//Deno.bomb();
	await Deno.create(app.appspacePath('visitors.txt'));
});
m.downFrom(1, async() => {
	await Deno.remove(app.appspacePath('visitors.txt'));
});

async function helloWorld(ctx:Context) {
	if( !ctx.proxyId ) throw new Error("Expected an authenticated user");

	// first read file to get past visitors:
	const visitors = await Deno.readTextFile(app.appspacePath('visitors.txt'));

	const user = await app.getUser(ctx.proxyId);
	await Deno.writeFile(app.appspacePath('visitors.txt'), new TextEncoder().encode(user.displayName+'\n'), {append:true});
	const html = `
	<h1>Hello ${user.displayName}</h1>
	<img src="avatars/${user.avatar}">
	<pre>${visitors}</pre>
	`;
	ctx.req.respond({body:html});
}

const r = new RoutesBuilder;
r.add("get", "/", {allow:AuthAllow.authorized}, helloWorld);

r.add("get", {path:"/avatars", end: false}, {allow:AuthAllow.authorized}, r.staticFileHandler({path:'@avatars/'}));

const app = createApp({
	routes: r.routes,
	migrations: m.migrations
});
