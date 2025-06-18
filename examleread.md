ngrok/ngrok
Javascript SDK for ngrok
npm.rs MIT licensed Apache-2.0 licensed Continuous integration

ngrok-javascript is the official Node.js SDK for ngrok that requires no binaries. Quickly enable secure production-ready connectivity to your applications and services directly from your code.

ngrok is a globally distributed gateway that provides secure connectivity for applications and services running in any environment.

Installation
Using npm:

npm install @ngrok/ngrok
Copy
Using yarn:

yarn add @ngrok/ngrok
Copy
Using pnpm:

pnpm add @ngrok/ngrok
Copy
Quickstart
Install @ngrok/ngrok

Export your authtoken from the ngrok dashboard as NGROK_AUTHTOKEN in your terminal

Add the following code to your application to establish connectivity via the forward method through port 8080 over localhost:

// Require ngrok javascript sdk
const ngrok = require("@ngrok/ngrok");
// import ngrok from '@ngrok/ngrok' // if inside a module

(async function() {
  // Establish connectivity
  const listener = await ngrok.forward({ addr: 8080, authtoken_from_env: true });

  // Output ngrok url to console
  console.log(`Ingress established at: ${listener.url()}`);
})();

process.stdin.resume();
Copy
That's it! Your application should now be available through the url output in your terminal.

Note You can find more examples in the examples directory.

Documentation
A quickstart guide and a full API reference are included in the ngrok-javascript documentation.

Authorization
To use ngrok you'll need an authtoken. To obtain one, sign up for free at ngrok.com and retrieve it from the authtoken page of your ngrok dashboard. Once you have copied your authtoken, you can reference it in several ways.

You can set it in the NGROK_AUTHTOKEN environment variable and pass authtoken_from_env: true to the forward method:

await ngrok.forward({ authtoken_from_env: true, ... });
Copy
Or pass the authtoken directly to the forward method:

await ngrok.forward({ authtoken: token, ... });
Copy
Or set it for all connections with the authtoken method:

await ngrok.authtoken(token);
Copy
Connection
The forward method is the easiest way to start an ngrok session and establish a listener to a specified address. The forward method returns a promise that resolves to the public URL of the listener.

With no arguments the forward method will start an HTTP listener to localhost port 80:

const ngrok = require("@ngrok/ngrok");
// import ngrok from '@ngrok/ngrok' // if inside a module

(async function() {
  console.log( (await ngrok.forward()).url() );
})();
Copy
You can pass the port number to forward on localhost:

const listener = await ngrok.forward(4242);
Copy
Or you can specify the host and port via a string:

const listener = await ngrok.forward("localhost:4242");
Copy
More options can be passed to the forward method to customize the connection:

const listener = await ngrok.forward({ addr: 8080, basic_auth: "ngrok:online1line" });
const listener = await ngrok.forward({ addr: 8080, oauth_provider: "google", oauth_allow_domains: "example.com" });
Copy
The (optional) proto parameter is the listener type, which defaults to http. To create a TCP listener:

const listener = await ngrok.forward({ proto: 'tcp', addr: 25565 });
Copy
See Full Configuration for the list of possible configuration options.

Disconnection
The close method on a listener will shut it down, and also stop the ngrok session if it is no longer needed. This method returns a promise that resolves when the listener is closed.

const listener = await ngrok.getListenerByUrl(url);
await listener.close();
Copy
Or use the disconnect method with the url() of the listener to close (or id() for a Labeled Listener):

await ngrok.disconnect(listener.url());
Copy
Or omit the url() to close all listeners:

await ngrok.disconnect();
Copy
Listing Listeners
To list all current non-closed listeners use the listeners method:

const listeners = await ngrok.listeners();
Copy
Builders
For more control over Sessions and Listeners, the builder classes can be used.

A minimal example using the builder class looks like the following:

async function create_listener() {
  const session = await new ngrok.NgrokSessionBuilder().authtokenFromEnv().connect();
  const listener = await session.httpEndpoint().listen();
  console.log("Ingress established at:", listener.url());
  listener.forward("localhost:8081");
}
Copy
See here for a Full Configuration Example

TLS Backends
As of version 0.7.0 there is backend TLS connection support, validated by a filepath specified in the SSL_CERT_FILE environment variable, or falling back to the host OS installed trusted certificate authorities. So it is now possible to do this to forward:

await ngrok.forward({ addr: "https://127.0.0.1:3000", authtoken_from_env: true });
Copy
If the service is using certs not trusted by the OS, such as self-signed certificates, add an environment variable like this before running: SSL_CERT_FILE=/path/to/ca.crt. There is also a verify_upstream_tls: false option to disable certification verification.

Async Programming
All methods return a Promise and are suitable for use in asynchronous programming. You can use callback chaining with .then() and .catch() syntax or the await keyword to wait for completion of an API call.

Error Handling
All asynchronous functions will throw an error on failure to set up a session or listener, which can be caught and dealt with using try/catch or then/catch statements:

new ngrok.NgrokSessionBuilder().authtokenFromEnv().connect()
    .then((session) => {
        session.httpEndpoint().listen()
            .then((tun) => {})
            .catch(err => console.log('listener setup error: ' + err))
    })
    .catch(err => console.log('session setup error: ' + err))
    .await;
Copy
Full Configuration
This example shows all the possible configuration items of ngrok.forward:

const listener = await ngrok.forward({
  // session configuration
  addr: `localhost:8080`, // or `8080` or `unix:${UNIX_SOCKET}`
  authtoken: "",
  authtoken_from_env: true,
  on_status_change: (addr, error) => {
    console.log(`disconnected, addr ${addr} error: ${error}`);
  },
  session_metadata: "Online in One Line",
  // advanced session connection configuration
  server_addr: "example.com:443",
  root_cas: "trusted",
  session_ca_cert: fs.readFileSync("ca.pem", "utf8"),  
  // listener configuration
  metadata: "example listener metadata from javascript",
  domain: "",
  proto: "http",
  proxy_proto: "", // One of: "", "1", "2"
  schemes: ["HTTPS"],
  labels: "edge:edghts_2G...",  // Along with proto="labeled"
  app_protocol: "http2",
  // module configuration
  basic_auth: ["ngrok:online1line"],
  circuit_breaker: 0.1,
  compression: true,
  allow_user_agent: "^mozilla.*",
  deny_user_agent: "^curl.*",
  ip_restriction_allow_cidrs: ["0.0.0.0/0"],
  ip_restriction_deny_cidrs: ["10.1.1.1/32"],
  crt: fs.readFileSync("crt.pem", "utf8"),
  key: fs.readFileSync("key.pem", "utf8"),
  mutual_tls_cas: [fs.readFileSync('ca.crt', 'utf8')],
  oauth_provider: "google",
  oauth_allow_domains: [""],
  oauth_allow_emails: [""],
  oauth_scopes: [""],
  oauth_client_id: "",
  oauth_client_secret: "",
  oidc_issuer_url: "",
  oidc_client_id: "",
  oidc_client_secret: "",
  oidc_allow_domains: [""],
  oidc_allow_emails: [""],
  oidc_scopes: [""],
  pooling_enabled: false,
  traffic_policy: "",
  request_header_remove: ["X-Req-Nope"],
  response_header_remove: ["X-Res-Nope"],
  request_header_add: ["X-Req-Yup:true"],
  response_header_add: ["X-Res-Yup:true"],
  verify_upstream_tls: false,
  verify_webhook_provider: "twilio",
  verify_webhook_secret: "asdf",
  websocket_tcp_converter: true,
});
Copy
The Config interface also shows all the available options.

Examples
Degit can be used for cloning and running an example directory like this:

npx degit github:ngrok/ngrok-javascript/examples/<example> <folder-name>
cd <folder-name>
npm i
Copy
For example:

npx degit github:ngrok/ngrok-javascript/examples/express express && cd express && npm i
Copy
Frameworks
AWS App Runner
Express
Fastify Example
Hapi Example
Koa Example
Nest.js
Next.js
Remix
Svelte
Typescript
Vue
Winston (Logging)
Listeners
ngrok.forward (minimal)
ngrok.forward (full)
HTTP (ngrok.listener)
HTTP (SessionBuilder minimal)
HTTP (SessionBuilder full)
Labeled
TCP
TLS
Windows Pipe
Platform Support
Pre-built binaries are provided on NPM for the following platforms:

OS	i686	x64	aarch64	arm
Windows	✓	✓	✓	
MacOS		✓	✓	✓
Linux		✓	✓	✓
Linux musl		✓	✓	
FreeBSD		✓		
Android			✓	✓
Note ngrok-javascript, and ngrok-rust which it depends on, are open source, so it may be possible to build them for other platforms.

On Windows, ensure you have Microsoft Visual C++ Redistributable installed.

We currently support MacOS 10.13+.

Dependencies
NAPI-RS, an excellent system to ease development and building of Rust plugins for NodeJS.
Changelog
Changes to ngrok-javascript are tracked under CHANGELOG.md.

Join the ngrok Community
Check out our official docs
Read about updates on our blog
Open an issue or pull request
Join our Slack community
Follow us on X / Twitter (@ngrokHQ)
Subscribe to our Youtube channel (@ngrokHQ)
License
This work is dual-licensed under Apache, Version 2.0 and MIT. You can choose between one of them if you use this work.

Contributions
Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in ngrok-javascript by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.

Javascript SDK for ngrok
Installation
Quickstart
Documentation
Authorization
Connection
Disconnection
Listing Listeners
Builders
TLS Backends
Async Programming
Error Handling
Full Configuration
Examples
Frameworks
Listeners
Platform Support
Dependencies
Changelog
Join the ngrok Community
License
Contributions
@ngrok/ngrok
Generated using TypeDoc



Connect
Get an endpoint online.

SDK
NodeJS

Choose another platform
Installation
Setup an example by making a directory:

Copy code
mkdir hello-ngrok && cd hello-ngrok
To install nvm and node, follow the instructions here

Initialize your node project and install the ngrok-node package:

Copy code
npm init -y && npm install @ngrok/ngrok
Now we need a runnable example. Let's create a new index file:

Copy code
touch index.js
Put your app online
hello-ngrok/index.js
Copy code
const http = require('http');
const ngrok = require('@ngrok/ngrok');

// Create webserver
http.createServer((req, res) => {
	res.writeHead(200, { 'Content-Type': 'text/html' });
	res.end('Congrats you have created an ngrok web server');
}).listen(8080, () => console.log('Node.js web server at 8080 is running...'));

// Get your endpoint online
ngrok.connect({ addr: 8080, authtoken_from_env: true })
	.then(listener => console.log(`Ingress established at: ${listener.url()}`));
Run your NodeJS app with your ngrok Authtoken as an environment variable.

Copy code
NGROK_AUTHTOKEN=2ydQwnoQ959SjtwIZh5WnIzkhUy_7jW5NyW5qkLVTYdge1rpA node index.js
Learn More
ngrok-nodejs Guide
ngrok-nodejs GitHub Repo