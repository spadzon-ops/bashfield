The Netlify deploy errored, with the following guidance provided:

### Diagnosis
The build failed due to a syntax error in the file `/pages/listing/[id].js`.

The specific error is an "Unterminated regexp literal."

### Solution
1. In the file `/pages/listing/[id].js` at line 582, check for an unterminated regular expression literal.
2. Correct the regular expression to ensure it is properly terminated to fix the syntax error.

It's also suggested to run `npm run build` locally to identify and correct any issues with the regular expression error.

The relevant error logs are:

Line 73:   npm audit fix --force
Line 74: Run `npm audit` for details.
Line 75: > bashfield@0.1.1 build
Line 76: > next build
Line 77:  [37m[1m [22m[39m Linting and checking validity of types ...
Line 78:   [1m[38;2;173;127;168m ▲ Next.js 14.0.4[39m[22m
Line 79:    - Experiments (use at your own risk):
Line 80:      · esmExternals
Line 81:  [37m[1m [22m[39m Creating an optimized production build ...
Line 82:  [33m[1m⚠[22m[39m Found lockfile missing swc dependencies, run next locally to automatically patch
Line 83: Failed during stage 'building site': Build script returned non-zero exit code: 2
Line 84: [31mFailed to compile.
Line 85: [39m
Line 86: ./pages/listing/[id].js
Line 87: Error:
Line 88:   [31mx[0m Unterminated regexp literal
Line 89:      ,-[[36;1;4m/opt/build/repo/bashfield/pages/listing/[id].js[0m:582:1]
Line 90:  [2m582[0m |             </div>
Line 91:  [2m583[0m |           </div>
Line 92:  [2m584[0m |         </div>
Line 93:  [2m585[0m |       </div>
Line 94:      : [31;1m       ^^^^^[0m
Line 95:  [2m586[0m |     </div>
Line 96:  [2m587[0m |   )
Line 97:  [2m588[0m | }
Line 98:      `----

Caused by:
    Syntax Error

Import trace for requested module:
./pages/listing/[id].js
Line 99: > Build failed because of webpack errors
Line 100: [91m[1m​[22m[39m
Line 101: [91m[1m"build.command" failed                                        [22m[39m
Line 102: [91m[1m────────────────────────────────────────────────────────────────[22m[39m
Line 103: ​
Line 104:   [31m[1mError message[22m[39m
Line 105:   Command failed with exit code 1: npm install --legacy-peer-deps && npm run build
Line 106: ​
Line 107:   [31m[1mError location[22m[39m
Line 108:   In build.command from netlify.toml:
Line 109:   npm install --legacy-peer-deps && npm run build
Line 110: ​
Line 111:   [31m[1mResolved config[22m[39m
Line 112:   build:
Line 113:     base: /opt/build/repo/bashfield
Line 114:     command: npm install --legacy-peer-deps && npm run build
Line 115:     commandOrigin: config
Line 116:     environment:
Line 117:       - NEXT_PUBLIC_ADMIN_EMAIL
Line 119:       - NEXT_PUBLIC_SUPABASE_ANON_KEY
Line 120:       - NEXT_PUBLIC_SUPABASE_URL
Line 121:       - NODE_VERSION
Line 122:       - SUPABASE_SERVICE_ROLE_KEY
Line 123:     publish: /opt/build/repo/bashfield/.next
Line 124:     publishOrigin: config
Line 125:   plugins:
Line 126:     - inputs: {}
Line 127:       origin: config
Line 128:       package: "@netlify/plugin-nextjs"
Line 129: Build failed due to a user error: Build script returned non-zero exit code: 2
Line 130: Failing build: Failed to build site
Line 131: Finished processing build request in 25.137s
