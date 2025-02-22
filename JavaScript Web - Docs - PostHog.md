---
created: 2025-02-23T08:42:29 (UTC +11:00)
tags: []
source: https://posthog.com/docs/libraries/js
author: 
---

# JavaScript Web - Docs - PostHog

> ## Excerpt
> Note:  This doc refers to our  posthog-js  library for use on the browser. For server-side JavaScript, see our  Node SDK . Installation Track across…

---
##### Which features are available in this library?

-   Event capture[](https://posthog.com/tutorials/event-tracking-guide)
-   Autocapture[](https://posthog.com/docs/product-analytics/autocapture)
-   User identification[](https://posthog.com/docs/product-analytics/identify)
-   Session replay[](https://posthog.com/docs/session-replay)
-   Feature flags[](https://posthog.com/docs/feature-flags)
-   Group analytics[](https://posthog.com/docs/product-analytics/group-analytics)
-   Surveys[](https://posthog.com/docs/surveys)
-   LLM observability[](https://posthog.com/docs/ai-engineering/observability)
-   Error tracking[](https://posthog.com/docs/error-tracking)

> **Note:** This doc refers to our [posthog-js](https://github.com/PostHog/posthog-js) library for use on the browser. For server-side JavaScript, see our [Node SDK](https://posthog.com/docs/libraries/node).

## Installation

### Option 1: Add the JavaScript snippet to your HTML Recommended

This is the simplest way to get PostHog up and running. It only takes a few minutes.

Copy the snippet below and replace `<ph_project_api_key>` and `<ph_client_api_host>` with your project's values, then add it within the `<head>` tags at the base of your product - ideally just before the closing `</head>` tag. This ensures PostHog loads on any page users visit.

You can find the snippet pre-filled with this data in [your project settings](https://us.posthog.com/settings/project#snippet).

```
<p><code id="code-lang-html"></code></p><p><code id="code-lang-html"><span><span>&lt;</span></span><span><span>script</span></span><span><span>&gt;</span></span><span><span id="code-lang-javascript"></span></span></code></p><p><code id="code-lang-html"><span><span id="code-lang-javascript">    </span></span><span><span id="code-lang-javascript">!</span></span><span><span id="code-lang-javascript">function</span></span><span><span id="code-lang-javascript">(</span></span><span><span id="code-lang-javascript">t</span></span><span><span id="code-lang-javascript">,</span></span><span><span id="code-lang-javascript">e</span></span><span><span id="code-lang-javascript">)</span></span><span><span id="code-lang-javascript">{</span></span><span><span id="code-lang-javascript">var</span></span><span><span id="code-lang-javascript"> o</span></span><span><span id="code-lang-javascript">,</span></span><span><span id="code-lang-javascript">n</span></span><span><span id="code-lang-javascript">,</span></span><span><span id="code-lang-javascript">p</span></span><span><span id="code-lang-javascript">,</span></span><span><span id="code-lang-javascript">r</span></span><span><span id="code-lang-javascript">;</span></span><span><span id="code-lang-javascript">e</span></span><span><span id="code-lang-javascript">.</span></span><span><span id="code-lang-javascript">__SV</span></span><span><span id="code-lang-javascript">||</span></span><span><span id="code-lang-javascript">(</span></span><span><span id="code-lang-javascript">window</span></span><span><span id="code-lang-javascript">.</span></span><span><span id="code-lang-javascript">posthog</span></span><span><span id="code-lang-javascript">=</span></span><span><span id="code-lang-javascript">e</span></span><span><span id="code-lang-javascript">,</span></span><span><span id="code-lang-javascript">e</span></span><span><span id="code-lang-javascript">.</span></span><span><span id="code-lang-javascript">_i</span></span><span><span id="code-lang-javascript">=</span></span><span><span id="code-lang-javascript">[</span></span><span><span id="code-lang-javascript">]</span></span><span><span id="code-lang-javascript">,</span></span><span><span id="code-lang-javascript">e</span></span><span><span id="code-lang-javascript">.</span></span><span><span id="code-lang-javascript">init</span></span><span><span id="code-lang-javascript">=</span></span><span><span id="code-lang-javascript">function</span></span><span><span id="code-lang-javascript">(</span></span><span><span id="code-lang-javascript">i</span></span><span><span id="code-lang-javascript">,</span></span><span><span id="code-lang-javascript">s</span></span><span><span id="code-lang-javascript">,</span></span><span><span id="code-lang-javascript">a</span></span><span><span id="code-lang-javascript">)</span></span><span><span id="code-lang-javascript">{</span></span><span><span id="code-lang-javascript">function</span></span><span><span id="code-lang-javascript"> </span></span><span><span id="code-lang-javascript">g</span></span><span><span id="code-lang-javascript">(</span></span><span><span id="code-lang-javascript">t</span></span><span><span id="code-lang-javascript">,</span></span><span><span id="code-lang-javascript">e</span></span><span><span id="code-lang-javascript">)</span></span><span><span id="code-lang-javascript">{</span></span><span><span id="code-lang-javascript">var</span></span><span><span id="code-lang-javascript"> o</span></span><span><span id="code-lang-javascript">=</span></span><span><span id="code-lang-javascript">e</span></span><span><span id="code-lang-javascript">.</span></span><span><span id="code-lang-javascript">split</span></span><span><span id="code-lang-javascript">(</span></span><span><span id="code-lang-javascript">"."</span></span><span><span id="code-lang-javascript">)</span></span><span><span id="code-lang-javascript">;</span></span><span><span id="code-lang-javascript">2</span></span><span><span id="code-lang-javascript">==</span></span><span><span id="code-lang-javascript">o</span></span><span><span id="code-lang-javascript">.</span></span><span><span id="code-lang-javascript">length</span></span><span><span id="code-lang-javascript">&amp;&amp;</span></span><span><span id="code-lang-javascript">(</span></span><span><span id="code-lang-javascript">t</span></span><span><span id="code-lang-javascript">=</span></span><span><span id="code-lang-javascript">t</span></span><span><span id="code-lang-javascript">[</span></span><span><span id="code-lang-javascript">o</span></span><span><span id="code-lang-javascript">[</span></span><span><span id="code-lang-javascript">0</span></span><span><span id="code-lang-javascript">]</span></span><span><span id="code-lang-javascript">]</span></span><span><span id="code-lang-javascript">,</span></span><span><span id="code-lang-javascript">e</span></span><span><span id="code-lang-javascript">=</span></span><span><span id="code-lang-javascript">o</span></span><span><span id="code-lang-javascript">[</span></span><span><span id="code-lang-javascript">1</span></span><span><span id="code-lang-javascript">]</span></span><span><span id="code-lang-javascript">)</span></span><span><span id="code-lang-javascript">,</span></span><span><span id="code-lang-javascript">t</span></span><span><span id="code-lang-javascript">[</span></span><span><span id="code-lang-javascript">e</span></span><span><span id="code-lang-javascript">]</span></span><span><span id="code-lang-javascript">=</span></span><span><span id="code-lang-javascript">function</span></span><span><span id="code-lang-javascript">(</span></span><span><span id="code-lang-javascript">)</span></span><span><span id="code-lang-javascript">{</span></span><span><span id="code-lang-javascript">t</span></span><span><span id="code-lang-javascript">.</span></span><span><span id="code-lang-javascript">push</span></span><span><span id="code-lang-javascript">(</span></span><span><span id="code-lang-javascript">[</span></span><span><span id="code-lang-javascript">e</span></span><span><span id="code-lang-javascript">]</span></span><span><span id="code-lang-javascript">.</span></span><span><span id="code-lang-javascript">concat</span></span><span><span id="code-lang-javascript">(</span></span><span><span id="code-lang-javascript">Array</span></span><span><span id="code-lang-javascript">.</span></span><span><span id="code-lang-javascript">prototype</span></span><span><span id="code-lang-javascript">.</span></span><span><span id="code-lang-javascript">slice</span></span><span><span id="code-lang-javascript">.</span></span><span><span id="code-lang-javascript">call</span></span><span><span id="code-lang-javascript">(</span></span><span><span id="code-lang-javascript">arguments</span></span><span><span id="code-lang-javascript">,</span></span><span><span id="code-lang-javascript">0</span></span><span><span id="code-lang-javascript">)</span></span><span><span id="code-lang-javascript">)</span></span><span><span id="code-lang-javascript">)</span></span><span><span id="code-lang-javascript">}</span></span><span><span id="code-lang-javascript">}</span></span><span><span id="code-lang-javascript">(</span></span><span><span id="code-lang-javascript">p</span></span><span><span id="code-lang-javascript">=</span></span><span><span id="code-lang-javascript">t</span></span><span><span id="code-lang-javascript">.</span></span><span><span id="code-lang-javascript">createElement</span></span><span><span id="code-lang-javascript">(</span></span><span><span id="code-lang-javascript">"script"</span></span><span><span id="code-lang-javascript">)</span></span><span><span id="code-lang-javascript">)</span></span><span><span id="code-lang-javascript">.</span></span><span><span id="code-lang-javascript">type</span></span><span><span id="code-lang-javascript">=</span></span><span><span id="code-lang-javascript">"text/javascript"</span></span><span><span id="code-lang-javascript">,</span></span><span><span id="code-lang-javascript">p</span></span><span><span id="code-lang-javascript">.</span></span><span><span id="code-lang-javascript">crossOrigin</span></span><span><span id="code-lang-javascript">=</span></span><span><span id="code-lang-javascript">"anonymous"</span></span><span><span id="code-lang-javascript">,</span></span><span><span id="code-lang-javascript">p</span></span><span><span id="code-lang-javascript">.</span></span><span><span id="code-lang-javascript">async</span></span><span><span id="code-lang-javascript">=</span></span><span><span id="code-lang-javascript">!</span></span><span><span id="code-lang-javascript">0</span></span><span><span id="code-lang-javascript">,</span></span><span><span id="code-lang-javascript">p</span></span><span><span id="code-lang-javascript">.</span></span><span><span id="code-lang-javascript">src</span></span><span><span id="code-lang-javascript">=</span></span><span><span id="code-lang-javascript">s</span></span><span><span id="code-lang-javascript">.</span></span><span><span id="code-lang-javascript">api_host</span></span><span><span id="code-lang-javascript">.</span></span><span><span id="code-lang-javascript">replace</span></span><span><span id="code-lang-javascript">(</span></span><span><span id="code-lang-javascript">".i.posthog.com"</span></span><span><span id="code-lang-javascript">,</span></span><span><span id="code-lang-javascript">"-assets.i.posthog.com"</span></span><span><span id="code-lang-javascript">)</span></span><span><span id="code-lang-javascript">+</span></span><span><span id="code-lang-javascript">"/static/array.js"</span></span><span><span id="code-lang-javascript">,</span></span><span><span id="code-lang-javascript">(</span></span><span><span id="code-lang-javascript">r</span></span><span><span id="code-lang-javascript">=</span></span><span><span id="code-lang-javascript">t</span></span><span><span id="code-lang-javascript">.</span></span><span><span id="code-lang-javascript">getElementsByTagName</span></span><span><span id="code-lang-javascript">(</span></span><span><span id="code-lang-javascript">"script"</span></span><span><span id="code-lang-javascript">)</span></span><span><span id="code-lang-javascript">[</span></span><span><span id="code-lang-javascript">0</span></span><span><span id="code-lang-javascript">]</span></span><span><span id="code-lang-javascript">)</span></span><span><span id="code-lang-javascript">.</span></span><span><span id="code-lang-javascript">parentNode</span></span><span><span id="code-lang-javascript">.</span></span><span><span id="code-lang-javascript">insertBefore</span></span><span><span id="code-lang-javascript">(</span></span><span><span id="code-lang-javascript">p</span></span><span><span id="code-lang-javascript">,</span></span><span><span id="code-lang-javascript">r</span></span><span><span id="code-lang-javascript">)</span></span><span><span id="code-lang-javascript">;</span></span><span><span id="code-lang-javascript">var</span></span><span><span id="code-lang-javascript"> u</span></span><span><span id="code-lang-javascript">=</span></span><span><span id="code-lang-javascript">e</span></span><span><span id="code-lang-javascript">;</span></span><span><span id="code-lang-javascript">for</span></span><span><span id="code-lang-javascript">(</span></span><span><span id="code-lang-javascript">void</span></span><span><span id="code-lang-javascript"> </span></span><span><span id="code-lang-javascript">0</span></span><span><span id="code-lang-javascript">!==</span></span><span><span id="code-lang-javascript">a</span></span><span><span id="code-lang-javascript">?</span></span><span><span id="code-lang-javascript">u</span></span><span><span id="code-lang-javascript">=</span></span><span><span id="code-lang-javascript">e</span></span><span><span id="code-lang-javascript">[</span></span><span><span id="code-lang-javascript">a</span></span><span><span id="code-lang-javascript">]</span></span><span><span id="code-lang-javascript">=</span></span><span><span id="code-lang-javascript">[</span></span><span><span id="code-lang-javascript">]</span></span><span><span id="code-lang-javascript">:</span></span><span><span id="code-lang-javascript">a</span></span><span><span id="code-lang-javascript">=</span></span><span><span id="code-lang-javascript">"posthog"</span></span><span><span id="code-lang-javascript">,</span></span><span><span id="code-lang-javascript">u</span></span><span><span id="code-lang-javascript">.</span></span><span><span id="code-lang-javascript">people</span></span><span><span id="code-lang-javascript">=</span></span><span><span id="code-lang-javascript">u</span></span><span><span id="code-lang-javascript">.</span></span><span><span id="code-lang-javascript">people</span></span><span><span id="code-lang-javascript">||</span></span><span><span id="code-lang-javascript">[</span></span><span><span id="code-lang-javascript">]</span></span><span><span id="code-lang-javascript">,</span></span><span><span id="code-lang-javascript">u</span></span><span><span id="code-lang-javascript">.</span></span><span><span id="code-lang-javascript">toString</span></span><span><span id="code-lang-javascript">=</span></span><span><span id="code-lang-javascript">function</span></span><span><span id="code-lang-javascript">(</span></span><span><span id="code-lang-javascript">t</span></span><span><span id="code-lang-javascript">)</span></span><span><span id="code-lang-javascript">{</span></span><span><span id="code-lang-javascript">var</span></span><span><span id="code-lang-javascript"> e</span></span><span><span id="code-lang-javascript">=</span></span><span><span id="code-lang-javascript">"posthog"</span></span><span><span id="code-lang-javascript">;</span></span><span><span id="code-lang-javascript">return</span></span><span><span id="code-lang-javascript">"posthog"</span></span><span><span id="code-lang-javascript">!==</span></span><span><span id="code-lang-javascript">a</span></span><span><span id="code-lang-javascript">&amp;&amp;</span></span><span><span id="code-lang-javascript">(</span></span><span><span id="code-lang-javascript">e</span></span><span><span id="code-lang-javascript">+=</span></span><span><span id="code-lang-javascript">"."</span></span><span><span id="code-lang-javascript">+</span></span><span><span id="code-lang-javascript">a</span></span><span><span id="code-lang-javascript">)</span></span><span><span id="code-lang-javascript">,</span></span><span><span id="code-lang-javascript">t</span></span><span><span id="code-lang-javascript">||</span></span><span><span id="code-lang-javascript">(</span></span><span><span id="code-lang-javascript">e</span></span><span><span id="code-lang-javascript">+=</span></span><span><span id="code-lang-javascript">" (stub)"</span></span><span><span id="code-lang-javascript">)</span></span><span><span id="code-lang-javascript">,</span></span><span><span id="code-lang-javascript">e</span></span><span><span id="code-lang-javascript">}</span></span><span><span id="code-lang-javascript">,</span></span><span><span id="code-lang-javascript">u</span></span><span><span id="code-lang-javascript">.</span></span><span><span id="code-lang-javascript">people</span></span><span><span id="code-lang-javascript">.</span></span><span><span id="code-lang-javascript">toString</span></span><span><span id="code-lang-javascript">=</span></span><span><span id="code-lang-javascript">function</span></span><span><span id="code-lang-javascript">(</span></span><span><span id="code-lang-javascript">)</span></span><span><span id="code-lang-javascript">{</span></span><span><span id="code-lang-javascript">return</span></span><span><span id="code-lang-javascript"> u</span></span><span><span id="code-lang-javascript">.</span></span><span><span id="code-lang-javascript">toString</span></span><span><span id="code-lang-javascript">(</span></span><span><span id="code-lang-javascript">1</span></span><span><span id="code-lang-javascript">)</span></span><span><span id="code-lang-javascript">+</span></span><span><span id="code-lang-javascript">".people (stub)"</span></span><span><span id="code-lang-javascript">}</span></span><span><span id="code-lang-javascript">,</span></span><span><span id="code-lang-javascript">o</span></span><span><span id="code-lang-javascript">=</span></span><span><span id="code-lang-javascript">"init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug"</span></span><span><span id="code-lang-javascript">.</span></span><span><span id="code-lang-javascript">split</span></span><span><span id="code-lang-javascript">(</span></span><span><span id="code-lang-javascript">" "</span></span><span><span id="code-lang-javascript">)</span></span><span><span id="code-lang-javascript">,</span></span><span><span id="code-lang-javascript">n</span></span><span><span id="code-lang-javascript">=</span></span><span><span id="code-lang-javascript">0</span></span><span><span id="code-lang-javascript">;</span></span><span><span id="code-lang-javascript">n</span></span><span><span id="code-lang-javascript">&lt;</span></span><span><span id="code-lang-javascript">o</span></span><span><span id="code-lang-javascript">.</span></span><span><span id="code-lang-javascript">length</span></span><span><span id="code-lang-javascript">;</span></span><span><span id="code-lang-javascript">n</span></span><span><span id="code-lang-javascript">++</span></span><span><span id="code-lang-javascript">)</span></span><span><span id="code-lang-javascript">g</span></span><span><span id="code-lang-javascript">(</span></span><span><span id="code-lang-javascript">u</span></span><span><span id="code-lang-javascript">,</span></span><span><span id="code-lang-javascript">o</span></span><span><span id="code-lang-javascript">[</span></span><span><span id="code-lang-javascript">n</span></span><span><span id="code-lang-javascript">]</span></span><span><span id="code-lang-javascript">)</span></span><span><span id="code-lang-javascript">;</span></span><span><span id="code-lang-javascript">e</span></span><span><span id="code-lang-javascript">.</span></span><span><span id="code-lang-javascript">_i</span></span><span><span id="code-lang-javascript">.</span></span><span><span id="code-lang-javascript">push</span></span><span><span id="code-lang-javascript">(</span></span><span><span id="code-lang-javascript">[</span></span><span><span id="code-lang-javascript">i</span></span><span><span id="code-lang-javascript">,</span></span><span><span id="code-lang-javascript">s</span></span><span><span id="code-lang-javascript">,</span></span><span><span id="code-lang-javascript">a</span></span><span><span id="code-lang-javascript">]</span></span><span><span id="code-lang-javascript">)</span></span><span><span id="code-lang-javascript">}</span></span><span><span id="code-lang-javascript">,</span></span><span><span id="code-lang-javascript">e</span></span><span><span id="code-lang-javascript">.</span></span><span><span id="code-lang-javascript">__SV</span></span><span><span id="code-lang-javascript">=</span></span><span><span id="code-lang-javascript">1</span></span><span><span id="code-lang-javascript">)</span></span><span><span id="code-lang-javascript">}</span></span><span><span id="code-lang-javascript">(</span></span><span><span id="code-lang-javascript">document</span></span><span><span id="code-lang-javascript">,</span></span><span><span id="code-lang-javascript">window</span></span><span><span id="code-lang-javascript">.</span></span><span><span id="code-lang-javascript">posthog</span></span><span><span id="code-lang-javascript">||</span></span><span><span id="code-lang-javascript">[</span></span><span><span id="code-lang-javascript">]</span></span><span><span id="code-lang-javascript">)</span></span><span><span id="code-lang-javascript">;</span></span><span><span id="code-lang-javascript"></span></span></code></p><p><code id="code-lang-html"><span><span id="code-lang-javascript">    posthog</span></span><span><span id="code-lang-javascript">.</span></span><span><span id="code-lang-javascript">init</span></span><span><span id="code-lang-javascript">(</span></span><span><span id="code-lang-javascript">'phc_NTxThPDPguBc7n4kSoErSdfQ1ttpgGoLjK96Xk82r6G'</span></span><span><span id="code-lang-javascript">,</span></span><span><span id="code-lang-javascript"> </span></span><span><span id="code-lang-javascript">{</span></span><span><span id="code-lang-javascript">api_host</span></span><span><span id="code-lang-javascript">:</span></span><span><span id="code-lang-javascript"> </span></span><span><span id="code-lang-javascript">'https://us.i.posthog.com'</span></span><span><span id="code-lang-javascript">}</span></span><span><span id="code-lang-javascript">)</span></span><span><span id="code-lang-javascript"></span></span></code></p><p><code id="code-lang-html"><span><span id="code-lang-javascript"></span></span><span><span>&lt;/</span></span><span><span>script</span></span><span><span>&gt;</span></span></code></p><p></p>
```

Once the snippet is added, PostHog automatically captures `$pageview` and [other events](https://posthog.com/docs/data/autocapture) like button clicks. You can then enable other products, such as session replays, within [your project settings](https://us.posthog.com/settings).

  
Set up a reverse proxy (recommended)

We recommend setting up a reverse proxy so that events are less likely to be intercepted by tracking blockers. We have our [own managed reverse proxy service included in the Teams plan](https://posthog.com/docs/advanced/proxy/managed-reverse-proxy), which routes through our infrastructure and makes setting up your proxy easy.

If you don't want to use our managed service then there are several other [options for creating a reverse proxy](https://posthog.com/docs/advanced/proxy), including using [Cloudflare](https://posthog.com/docs/advanced/proxy/cloudflare), [AWS Cloudfront](https://posthog.com/docs/advanced/proxy/cloudfront), and [Vercel](https://posthog.com/docs/advanced/proxy/vercel).

Include ES5 support (optional)

If you need ES5 support for example to track Internet Explorer 11 replace `/static/array.js` in the snippet with `/static/array.full.es5.js`

### Option 2: Install via package manager

And then include it in your files:

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>import</span></span><span><span> </span></span><span><span>posthog</span></span><span><span> </span></span><span><span>from</span></span><span><span> </span></span><span><span>'posthog-js'</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>init</span></span><span><span>(</span></span><span><span>'phc_NTxThPDPguBc7n4kSoErSdfQ1ttpgGoLjK96Xk82r6G'</span></span><span><span>,</span></span><span><span> </span></span><span><span>{</span></span><span><span> </span></span><span><span>api_host</span></span><span><span>:</span></span><span><span> </span></span><span><span>'https://us.i.posthog.com'</span></span><span><span> </span></span><span><span>}</span></span><span><span>)</span></span></code></p><p></p>
```

If you don't want to send test data while you're developing, you can do the following:

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>if</span></span><span><span> </span></span><span><span>(</span></span><span><span>!</span></span><span><span>window</span></span><span><span>.</span></span><span><span>location</span></span><span><span>.</span></span><span><span>host</span></span><span><span>.</span></span><span><span>includes</span></span><span><span>(</span></span><span><span>'127.0.0.1'</span></span><span><span>)</span></span><span><span> </span></span><span><span>&amp;&amp;</span></span><span><span> </span></span><span><span>!</span></span><span><span>window</span></span><span><span>.</span></span><span><span>location</span></span><span><span>.</span></span><span><span>host</span></span><span><span>.</span></span><span><span>includes</span></span><span><span>(</span></span><span><span>'localhost'</span></span><span><span>)</span></span><span><span>)</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    posthog</span></span><span><span>.</span></span><span><span>init</span></span><span><span>(</span></span><span><span>'phc_NTxThPDPguBc7n4kSoErSdfQ1ttpgGoLjK96Xk82r6G'</span></span><span><span>,</span></span><span><span> </span></span><span><span>{</span></span><span><span> </span></span><span><span>api_host</span></span><span><span>:</span></span><span><span> </span></span><span><span>'https://us.i.posthog.com'</span></span><span><span> </span></span><span><span>}</span></span><span><span>)</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>}</span></span></code></p><p></p>
```

If you're using React or Next.js, checkout our [React SDK](https://posthog.com/docs/libraries/react) or [Next.js integration](https://posthog.com/docs/libraries/next-js).

Bundle all required extensions (advanced)

By default, the JavaScript Web library only loads the core functionality. It lazy-loads extensions such as surveys or the session replay 'recorder' when needed.

This can cause issues if:

-   You have a Content Security Policy (CSP) that blocks inline scripts.
-   You want to optimize your bundle at build time to ensure all dependencies are ready immediately.
-   Your app is running in environments like the Chrome Extension store or [Electron](https://posthog.com/tutorials/electron-analytics) that reject or block remote code loading.

To solve these issues, we have multiple import options available below.

> **Note:** With any of the `no-external` options, the toolbar will be unavailable as this is only possible as a runtime dependency loaded directly from `us.posthog.com`.

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>// No external code loading possible (this disables all extensions such as Replay, Surveys, Exceptions etc.)</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>import</span></span><span><span> </span></span><span><span>posthog</span></span><span><span> </span></span><span><span>from</span></span><span><span> </span></span><span><span>'posthog-js/dist/module.no-external'</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>// No external code loading possible but all external dependencies pre-bundled</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>import</span></span><span><span> </span></span><span><span>posthog</span></span><span><span> </span></span><span><span>from</span></span><span><span> </span></span><span><span>'posthog-js/dist/module.full.no-external'</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>// All external dependencies pre-bundled and with the ability to load external scripts (primarily useful is you use Site Apps)</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>import</span></span><span><span> </span></span><span><span>posthog</span></span><span><span> </span></span><span><span>from</span></span><span><span> </span></span><span><span>'posthog-js/dist/module.full'</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>// Finally you can also import specific extra dependencies </span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>import</span></span><span><span> </span></span><span><span>"posthog-js/dist/recorder"</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>import</span></span><span><span> </span></span><span><span>"posthog-js/dist/surveys"</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>import</span></span><span><span> </span></span><span><span>"posthog-js/dist/exception-autocapture"</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>import</span></span><span><span> </span></span><span><span>"posthog-js/dist/tracing-headers"</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>import</span></span><span><span> </span></span><span><span>"posthog-js/dist/web-vitals"</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>import</span></span><span><span> </span></span><span><span>posthog</span></span><span><span> </span></span><span><span>from</span></span><span><span> </span></span><span><span>'posthog-js/dist/module.no-external'</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>// All other posthog commands are the same as usual</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>init</span></span><span><span>(</span></span><span><span>'phc_NTxThPDPguBc7n4kSoErSdfQ1ttpgGoLjK96Xk82r6G'</span></span><span><span>,</span></span><span><span> </span></span><span><span>{</span></span><span><span> </span></span><span><span>api_host</span></span><span><span>:</span></span><span><span> </span></span><span><span>'https://us.i.posthog.com'</span></span><span><span> </span></span><span><span>}</span></span><span><span>)</span></span></code></p><p></p>
```

> **Note:** You should ensure if using this option that you always import `posthog-js` from the same module, otherwise multiple bundles could get included. At this time `posthog-js/react` does not work with any module import other than the default.

### Track across marketing website & app

We recommend putting PostHog both on your homepage and your application if applicable. That means you'll be able to follow a user from the moment they come onto your website, all the way through signup and actually using your product.

> PostHog automatically sets a cross-domain cookie, so if your website is `yourapp.com` and your app is on `app.yourapp.com` users will be followed when they go from one to the other. See our tutorial on [cross-website tracking](https://posthog.com/tutorials/cross-domain-tracking) if you need to track users across different domains.

### Permitted domains

You can also configure "permitted domains" in your [project settings](https://app.posthog.com/project/settings). These are domains where you'll be able to record user sessions and use the PostHog toolbar.

## Capturing events

You can send custom events using `capture`:

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>capture</span></span><span><span>(</span></span><span><span>'user_signed_up'</span></span><span><span>)</span></span><span><span>;</span></span></code></p><p></p>
```

> **Tip:** We recommend using a `[object] [verb]` format for your event names, where `[object]` is the entity that the behavior relates to, and `[verb]` is the behavior itself. For example, `project created`, `user signed up`, or `invite sent`.

### Setting event properties

Optionally, you can also include additional information in the event by setting the properties value:

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>capture</span></span><span><span>(</span></span><span><span>'user_signed_up'</span></span><span><span>,</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>login_type</span></span><span><span>:</span></span><span><span> </span></span><span><span>"email"</span></span><span><span>,</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>is_free_trial</span></span><span><span>:</span></span><span><span> </span></span><span><span>true</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>}</span></span><span><span>)</span></span></code></p><p></p>
```

### Page views and autocapture

By default, PostHog automatically captures the following frontend events:

-   **Pageviews**, including the URL.
-   [**Autocaptured events**](https://posthog.com/docs/product-analytics/autocapture), such as any `click`, `change of input`, or submission associated with `a`, `button`, `form`, `input`, `select`, `textarea`, and `label` tags.

If you prefer to disable these, set the appropriate values in your [configuration options](https://posthog.com/docs/libraries/js#config).

### Manually capturing pageviews and pageleaves in single-page apps

PostHog automatically sends `$pageview` events whenever it gets loaded and `$pageleave` when they leaves. If you have a single-page app, that means it only sends pageview and pageleave once (when your app loads and when they leave).

To make sure any navigating a user does within your app gets captured, you can make pageview and pageleave calls manually.

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>// Capture pageview</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>capture</span></span><span><span>(</span></span><span><span>'$pageview'</span></span><span><span>)</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>// Capture pageleave</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>capture</span></span><span><span>(</span></span><span><span>'$pageleave'</span></span><span><span>)</span></span></code></p><p></p>
```

This automatically sends the current URL along with other [autocaptured properties](https://posthog.com/docs/product-analytics/autocapture#autocaptured-properties) like the referrer, OS, scroll depth, and more.

## Identifying users

> We strongly recommend reading our docs on [identifying users](https://posthog.com/docs/integrate/identifying-users) to better understand how to correctly use this method.

Using `identify`, you can capture identified events associated with specific users. This enables you to understand how they're using your product across different sessions, devices, and platforms.

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>identify</span></span><span><span>(</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>'distinct_id'</span></span><span><span>,</span></span><span><span> </span></span><span><span>// Required. Replace 'distinct_id' with your user's unique identifier</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>{</span></span><span><span> </span></span><span><span>email</span></span><span><span>:</span></span><span><span> </span></span><span><span>'max@hedgehogmail.com'</span></span><span><span>,</span></span><span><span> </span></span><span><span>name</span></span><span><span>:</span></span><span><span> </span></span><span><span>'Max Hedgehog'</span></span><span><span> </span></span><span><span>}</span></span><span><span>,</span></span><span><span>  </span></span><span><span>// $set, optional</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>{</span></span><span><span> </span></span><span><span>first_visited_url</span></span><span><span>:</span></span><span><span> </span></span><span><span>'/blog'</span></span><span><span> </span></span><span><span>}</span></span><span><span> </span></span><span><span>// $set_once, optional</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>)</span></span><span><span>;</span></span></code></p><p></p>
```

Calling `identify` creates a person profile if one doesn't exist already. This means all events for that distinct ID count as identified events.

You can get the distinct ID of the current user by calling `posthog.get_distinct_id()`.

## Get the current user's distinct ID

You may find it helpful to get the current user's distinct ID. For example, to check whether you've already called `identify` for a user or not.

To do this, call `posthog.get_distinct_id()`. This returns either the ID automatically generated by PostHog or the ID that has been passed by a call to `identify()`.

## Alias

Sometimes, you want to assign multiple distinct IDs to a single user. This is helpful when your primary distinct ID is inaccessible. For example, if a distinct ID used on the frontend is not available in your backend.

In this case, you can use `alias` to assign another distinct ID to the same user.

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>alias</span></span><span><span>(</span></span><span><span>'alias_id'</span></span><span><span>,</span></span><span><span> </span></span><span><span>'distinct_id'</span></span><span><span>)</span></span><span><span>;</span></span></code></p><p></p>
```

We strongly recommend reading our docs on [alias](https://posthog.com/docs/data/identify#alias-assigning-multiple-distinct-ids-to-the-same-user) to best understand how to correctly use this method.

## Reset after logout

If a user logs out, you should call `reset` to unlink any future events made on that device with that user.

This is important if your users are sharing a computer, as otherwise all of those users are grouped together into a single user due to shared cookies between sessions. **We strongly recommend you call `reset` on logout even if you don't expect users to share a computer.**

You can do that like so:

If you _also_ want to reset `device_id`, you can pass `true` as a parameter:

## Anonymous vs identfied events

PostHog captures two types of events: [**anonymous** and **identified**](https://posthog.com/docs/data/anonymous-vs-identified-events)

**Identified events** enable you to attribute events to specific users, and attach [person properties](https://posthog.com/docs/product-analytics/person-properties). They're best suited for logged-in users.

Scenarios where you want to capture identified events are:

-   Tracking logged-in users in B2B and B2C SaaS apps
-   Doing user segmented product analysis
-   Growth and marketing teams wanting to analyze the _complete_ conversion lifecycle

**Anonymous events** are events without individually identifiable data. They're best suited for [web analytics](https://posthog.com/docs/web-analytics) or apps where users aren't logged in.

Scenarios where you want to capture anonymous events are:

-   Tracking a marketing website
-   Content-focused sites
-   B2C apps where users don't sign up or log in

Under the hood, the key difference between identified and anonymous events is that for identified events we create a [person profile](https://posthog.com/docs/data/persons) for the user, whereas for anonymous events we do not.

> **💡 Tip:** Under our current [pricing](https://posthog.com/pricing), anonymous events can be up to 4x cheaper than identified ones (due to the cost of processing them), so it's recommended you only capture identified events when needed.

### How to capture anonymous events

The JavaScript Web SDK captures anonymous events by default. However, this may change depending on your [`person_profiles` config](https://posthog.com/docs/libraries/js#config) when initializing PostHog:

1.  `person_profiles: 'identified_only'` _(recommended)_ _(default)_ - Anonymous events are captured by default. PostHog only captures identified events for users where [person profiles](https://posthog.com/docs/data/persons) have already been created.
    
2.  `person_profiles: 'always'` - Capture identified events for all events.
    

For example:

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>init</span></span><span><span>(</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>'phc_NTxThPDPguBc7n4kSoErSdfQ1ttpgGoLjK96Xk82r6G'</span></span><span><span>,</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>        </span></span><span><span>api_host</span></span><span><span>:</span></span><span><span> </span></span><span><span>'https://us.i.posthog.com'</span></span><span><span>,</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>        </span></span><span><span>person_profiles</span></span><span><span>:</span></span><span><span> </span></span><span><span>'always'</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>}</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>)</span></span></code></p><p></p>
```

### How to capture identified events

If you've set the [`personProfiles` config](https://posthog.com/docs/libraries/js#config) to `IDENTIFIED_ONLY` (the default option), anonymous events are captured by default. Then, to capture identified events, call any of the following functions:

-   [`identify()`](https://posthog.com/docs/product-analytics/identify)
-   [`alias()`](https://posthog.com/docs/product-analytics/identify#alias-assigning-multiple-distinct-ids-to-the-same-user)
-   [`group()`](https://posthog.com/docs/product-analytics/group-analytics)
-   [`setPersonProperties()`](https://posthog.com/docs/product-analytics/person-properties)
-   [`setPersonPropertiesForFlags()`](https://posthog.com/docs/libraries/js#overriding-server-properties)
-   [`setGroupPropertiesForFlags()`](https://posthog.com/docs/libraries/js#overriding-server-properties)

When you call any of these functions, it creates a [person profile](https://posthog.com/docs/data/persons) for the user. Once this profile is created, all subsequent events for this user will be captured as identified events.

Alternatively, you can set `personProfiles` to `ALWAYS` to capture identified events by default.

## Setting person properties

To set [person properties](https://posthog.com/docs/data/user-properties) in these profiles, include them when capturing an event:

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>capture</span></span><span><span>(</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>  </span></span><span><span>'event_name'</span></span><span><span>,</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>  </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>$set</span></span><span><span>:</span></span><span><span> </span></span><span><span>{</span></span><span><span> </span></span><span><span>name</span></span><span><span>:</span></span><span><span> </span></span><span><span>'Max Hedgehog'</span></span><span><span>  </span></span><span><span>}</span></span><span><span>,</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>$set_once</span></span><span><span>:</span></span><span><span> </span></span><span><span>{</span></span><span><span> </span></span><span><span>initial_url</span></span><span><span>:</span></span><span><span> </span></span><span><span>'/blog'</span></span><span><span> </span></span><span><span>}</span></span><span><span>,</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>  </span></span><span><span>}</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>)</span></span></code></p><p></p>
```

Typically, person properties are set when an event occurs like `user updated email` but there may be occasions where you want to set person properties as its own event.

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>setPersonProperties</span></span><span><span>(</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>{</span></span><span><span> </span></span><span><span>name</span></span><span><span>:</span></span><span><span> </span></span><span><span>"Max Hedgehog"</span></span><span><span> </span></span><span><span>}</span></span><span><span>,</span></span><span><span> </span></span><span><span>// These properties are like the `$set` from above</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>{</span></span><span><span> </span></span><span><span>initial_url</span></span><span><span>:</span></span><span><span> </span></span><span><span>"/blog"</span></span><span><span> </span></span><span><span>}</span></span><span><span>  </span></span><span><span>// These properties are like the `$set_once` from above</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>)</span></span></code></p><p></p>
```

This creates a special `$set` event that is sent to PostHog. For more details on the difference between `$set` and `$set_once`, see our [person properties docs](https://posthog.com/docs/data/user-properties#what-is-the-difference-between-set-and-set_once).

## Super Properties

Super Properties are properties associated with events that are set once and then sent with every `capture` call, be it a $pageview, an autocaptured button click, or anything else.

They are set using `posthog.register`, which takes a properties object as a parameter, and they persist across sessions.

For example, take a look at the following call:

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>register</span></span><span><span>(</span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>'icecream pref'</span></span><span><span>:</span></span><span><span> </span></span><span><span>'vanilla'</span></span><span><span>,</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>team_id</span></span><span><span>:</span></span><span><span> </span></span><span><span>22</span></span><span><span>,</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>}</span></span><span><span>)</span></span></code></p><p></p>
```

The call above ensures that every event sent by the user will include `"icecream pref": "vanilla"` and `"team_id": 22`. This way, if you filtered events by property using `icecream_pref = vanilla`, it would display all events captured on that user after the `posthog.register` call, since they all include the specified Super Property.

This does **not** set the user's properties. It only sets the properties for their events. To store person properties, see the [setting person properties docs](https://posthog.com/docs/product-analytics/person-properties).

Furthermore, if you register the same property multiple times, the next event will use the new value of that property. If you want to register a property only once (e.g. for ad campaign properties) you can use `register_once`, like so:

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>register_once</span></span><span><span>(</span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>'campaign source'</span></span><span><span>:</span></span><span><span> </span></span><span><span>'twitter'</span></span><span><span>,</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>}</span></span><span><span>)</span></span></code></p><p></p>
```

Using `register_once` will ensure that if a property is already set, it will not be set again. For example, if the user already has property `"icecream pref": "vanilla"`, calling `posthog.register_once({"icecream pref": "chocolate"})` will **not** update the property.

### Removing stored Super Properties

Setting Super Properties creates a cookie on the client with the respective properties and their values. In order to stop sending a Super Property with events and remove the cookie, you can use `posthog.unregister`, like so:

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>unregister</span></span><span><span>(</span></span><span><span>'icecream pref'</span></span><span><span>)</span></span></code></p><p></p>
```

This will remove the Super Property and subsequent events will not include it.

## Opt out of data capture

You can completely opt-out users from data capture. To do this, there are two options:

1.  Opt users out by default by setting `opt_out_capturing_by_default` to `true` in your [PostHog config](https://posthog.com/docs/libraries/js#config).

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>init</span></span><span><span>(</span></span><span><span>'phc_NTxThPDPguBc7n4kSoErSdfQ1ttpgGoLjK96Xk82r6G'</span></span><span><span>,</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>opt_out_capturing_by_default</span></span><span><span>:</span></span><span><span> </span></span><span><span>true</span></span><span><span>,</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>}</span></span><span><span>)</span></span><span><span>;</span></span></code></p><p></p>
```

2.  Opt users out on a per-person basis by calling `posthog.opt_out_capturing()`.

Similarly, you can opt users in:

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>opt_in_capturing</span></span><span><span>(</span></span><span><span>)</span></span></code></p><p></p>
```

To check if a user is opted out:

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>has_opted_out_capturing</span></span><span><span>(</span></span><span><span>)</span></span></code></p><p></p>
```

## Feature Flags

PostHog's [feature flags](https://posthog.com/docs/feature-flags) enable you to safely deploy and roll back new features.

### Boolean feature flags

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>if</span></span><span><span> </span></span><span><span>(</span></span><span><span>posthog</span></span><span><span>.</span></span><span><span>isFeatureEnabled</span></span><span><span>(</span></span><span><span>'flag-key'</span></span><span><span>)</span></span><span><span> </span></span><span><span>)</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>// Do something differently for this user</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>// Optional: fetch the payload</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>const</span></span><span><span> matchedFlagPayload </span></span><span><span>=</span></span><span><span> posthog</span></span><span><span>.</span></span><span><span>getFeatureFlagPayload</span></span><span><span>(</span></span><span><span>'flag-key'</span></span><span><span>)</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>}</span></span></code></p><p></p>
```

### Multivariate feature flags

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>if</span></span><span><span> </span></span><span><span>(</span></span><span><span>posthog</span></span><span><span>.</span></span><span><span>getFeatureFlag</span></span><span><span>(</span></span><span><span>'flag-key'</span></span><span><span>)</span></span><span><span>  </span></span><span><span>==</span></span><span><span> </span></span><span><span>'variant-key'</span></span><span><span>)</span></span><span><span> </span></span><span><span>{</span></span><span><span> </span></span><span><span>// replace 'variant-key' with the key of your variant</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>// Do something differently for this user</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>// Optional: fetch the payload</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>const</span></span><span><span> matchedFlagPayload </span></span><span><span>=</span></span><span><span> posthog</span></span><span><span>.</span></span><span><span>getFeatureFlagPayload</span></span><span><span>(</span></span><span><span>'flag-key'</span></span><span><span>)</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>}</span></span></code></p><p></p>
```

### Ensuring flags are loaded before usage

Every time a user loads a page, we send a request in the background to fetch the feature flags that apply to that user. We store those flags in your chosen persistence option (local storage by default).

This means that for most pages, the feature flags are available immediately – **except for the first time a user visits**.

To handle this, you can use the `onFeatureFlags` callback to wait for the feature flag request to finish:

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>onFeatureFlags</span></span><span><span>(</span></span><span><span>function</span></span><span><span> </span></span><span><span>(</span></span><span><span>featureFlags</span></span><span><span>,</span></span><span><span> flagVariants</span></span><span><span>,</span></span><span><span> </span></span><span><span>{</span></span><span><span> errorsLoading </span></span><span><span>}</span></span><span><span>)</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>// feature flags are guaranteed to be available at this point</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>if</span></span><span><span> </span></span><span><span>(</span></span><span><span>posthog</span></span><span><span>.</span></span><span><span>isFeatureEnabled</span></span><span><span>(</span></span><span><span>'flag-key'</span></span><span><span>)</span></span><span><span>)</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>        </span></span><span><span>// do something</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>}</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>}</span></span><span><span>)</span></span></code></p><p></p>
```

#### Callback parameters

The `onFeatureFlags` callback receives the following parameters:

-   `flags: string[]`: An object containing the feature flags that apply to the user.
-   `flagVariants: Record<string, string | boolean>`: An object containing the variants that apply to the user.
-   `{ errorsLoading }: { errorsLoading?: boolean }`: An object containing a boolean indicating if an error occurred during the request to load the feature flags. This is `true` if the request timed out or if there was an error. It will be `false` or `undefined` if the request was successful.

You won't usually need to use these, but they are useful if you want to be extra careful about feature flags not being loaded yet because of a network error and/or a network timeout (see `feature_flag_request_timeout_ms`).

### Reloading feature flags

Feature flag values are cached. If something has changed with your user and you'd like to refetch their flag values, call:

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>reloadFeatureFlags</span></span><span><span>(</span></span><span><span>)</span></span></code></p><p></p>
```

### Overriding server properties

Sometimes, you might want to evaluate feature flags using properties that haven't been ingested yet, or were set incorrectly earlier. You can do so by setting properties the flag depends on with these calls:

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>setPersonPropertiesForFlags</span></span><span><span>(</span></span><span><span>{</span></span><span><span>'property1'</span></span><span><span>:</span></span><span><span> </span></span><span><span>'value'</span></span><span><span>,</span></span><span><span> </span></span><span><span>property2</span></span><span><span>:</span></span><span><span> </span></span><span><span>'value2'</span></span><span><span>}</span></span><span><span>)</span></span></code></p><p></p>
```

> **Note:** These are set for the entire session. Successive calls are additive: all properties you set are combined together and sent for flag evaluation.

Whenever you set these properties, we also trigger a reload of feature flags to ensure we have the latest values. You can disable this by passing in the optional parameter for reloading:

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>setPersonPropertiesForFlags</span></span><span><span>(</span></span><span><span>{</span></span><span><span>'property1'</span></span><span><span>:</span></span><span><span> </span></span><span><span>'value'</span></span><span><span>,</span></span><span><span> </span></span><span><span>property2</span></span><span><span>:</span></span><span><span> </span></span><span><span>'value2'</span></span><span><span>}</span></span><span><span>,</span></span><span><span> </span></span><span><span>false</span></span><span><span>)</span></span></code></p><p></p>
```

At any point, you can reset these properties by calling `resetPersonPropertiesForFlags`:

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>resetPersonPropertiesForFlags</span></span><span><span>(</span></span><span><span>)</span></span></code></p><p></p>
```

The same holds for [group](https://posthog.com/manual/group-analytics) properties:

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>// set properties for a group</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>setGroupPropertiesForFlags</span></span><span><span>(</span></span><span><span>{</span></span><span><span>'company'</span></span><span><span>:</span></span><span><span> </span></span><span><span>{</span></span><span><span>'property1'</span></span><span><span>:</span></span><span><span> </span></span><span><span>'value'</span></span><span><span>,</span></span><span><span> </span></span><span><span>property2</span></span><span><span>:</span></span><span><span> </span></span><span><span>'value2'</span></span><span><span>}</span></span><span><span>}</span></span><span><span>)</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>// reset properties for a given group:</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>resetGroupPropertiesForFlags</span></span><span><span>(</span></span><span><span>'company'</span></span><span><span>)</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>// reset properties for all groups:</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>resetGroupPropertiesForFlags</span></span><span><span>(</span></span><span><span>)</span></span></code></p><p></p>
```

> **Note:** You don't need to add the group names here, since these properties are automatically attached to the current group (set via `posthog.group()`). When you change the group, these properties are reset.

#### Automatic overrides

Whenever you call `posthog.identify` with person properties, we automatically add these properties to flag evaluation calls to help determine the correct flag values. The same is true for when you call `posthog.group()`.

#### Default overridden properties

By default, we always override some properties based on the user IP address.

The list of properties that this overrides:

1.  `$geoip_city_name`
2.  `$geoip_country_name`
3.  `$geoip_country_code`
4.  `$geoip_continent_name`
5.  `$geoip_continent_code`
6.  `$geoip_postal_code`
7.  `$geoip_time_zone`

This enables any geolocation-based flags to work without manually setting these properties.

### Request timeout

You can configure the `feature_flag_request_timeout_ms` parameter when initializing your PostHog client to set a flag request timeout. This helps prevent your code from being blocked in the case when PostHog's servers are too slow to respond. By default, this is set at 3 seconds.

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>init</span></span><span><span>(</span></span><span><span>'phc_NTxThPDPguBc7n4kSoErSdfQ1ttpgGoLjK96Xk82r6G'</span></span><span><span>,</span></span><span><span> </span></span><span><span>{</span></span><span><span> </span></span></code></p><p><code id="code-lang-javascript"><span><span>        </span></span><span><span>api_host</span></span><span><span>:</span></span><span><span> </span></span><span><span>'https://us.i.posthog.com'</span></span><span><span>,</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>        </span></span><span><span>feature_flag_request_timeout_ms</span></span><span><span>:</span></span><span><span> </span></span><span><span>3000</span></span><span><span> </span></span><span><span>// Time in milliseconds. Default is 3000 (3 seconds).</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>}</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>)</span></span></code></p><p></p>
```

### Error handling

When using the PostHog SDK, it's important to handle potential errors that may occur during feature flag operations. Here's an example of how to wrap PostHog SDK methods in an error handler:

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>function</span></span><span><span> </span></span><span><span>handleFeatureFlag</span></span><span><span>(</span></span><span><span>client</span></span><span><span>,</span></span><span><span> flagKey</span></span><span><span>,</span></span><span><span> distinctId</span></span><span><span>)</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>try</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>        </span></span><span><span>const</span></span><span><span> isEnabled </span></span><span><span>=</span></span><span><span> client</span></span><span><span>.</span></span><span><span>isFeatureEnabled</span></span><span><span>(</span></span><span><span>flagKey</span></span><span><span>,</span></span><span><span> distinctId</span></span><span><span>)</span></span><span><span>;</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>        </span></span><span><span>console</span></span><span><span>.</span></span><span><span>log</span></span><span><span>(</span></span><span><span>`</span></span><span><span>Feature flag '</span></span><span><span>${</span></span><span><span>flagKey</span></span><span><span>}</span></span><span><span>' for user '</span></span><span><span>${</span></span><span><span>distinctId</span></span><span><span>}</span></span><span><span>' is </span></span><span><span>${</span></span><span><span>isEnabled </span></span><span><span>?</span></span><span><span> </span></span><span><span>'enabled'</span></span><span><span> </span></span><span><span>:</span></span><span><span> </span></span><span><span>'disabled'</span></span><span><span>}</span></span><span><span>`</span></span><span><span>)</span></span><span><span>;</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>        </span></span><span><span>return</span></span><span><span> isEnabled</span></span><span><span>;</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>}</span></span><span><span> </span></span><span><span>catch</span></span><span><span> </span></span><span><span>(</span></span><span><span>error</span></span><span><span>)</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>        </span></span><span><span>console</span></span><span><span>.</span></span><span><span>error</span></span><span><span>(</span></span><span><span>`</span></span><span><span>Error fetching feature flag '</span></span><span><span>${</span></span><span><span>flagKey</span></span><span><span>}</span></span><span><span>': </span></span><span><span>${</span></span><span><span>error</span></span><span><span>.</span></span><span><span>message</span></span><span><span>}</span></span><span><span>`</span></span><span><span>)</span></span><span><span>;</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>        </span></span><span><span>// Optionally, you can return a default value or throw the error</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>        </span></span><span><span>// return false; // Default to disabled</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>        </span></span><span><span>throw</span></span><span><span> error</span></span><span><span>;</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>}</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>}</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>// Usage example</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>try</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>const</span></span><span><span> flagEnabled </span></span><span><span>=</span></span><span><span> </span></span><span><span>handleFeatureFlag</span></span><span><span>(</span></span><span><span>client</span></span><span><span>,</span></span><span><span> </span></span><span><span>'new-feature'</span></span><span><span>,</span></span><span><span> </span></span><span><span>'user-123'</span></span><span><span>)</span></span><span><span>;</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>if</span></span><span><span> </span></span><span><span>(</span></span><span><span>flagEnabled</span></span><span><span>)</span></span><span><span> </span></span><span><span>{</span></span><span><span>  </span></span></code></p><p><code id="code-lang-javascript"><span><span>        </span></span><span><span>// Implement new feature logic</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>}</span></span><span><span> </span></span><span><span>else</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>        </span></span><span><span>// Implement old feature logic</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>}</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>}</span></span><span><span> </span></span><span><span>catch</span></span><span><span> </span></span><span><span>(</span></span><span><span>error</span></span><span><span>)</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>// Handle the error at a higher level</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>console</span></span><span><span>.</span></span><span><span>error</span></span><span><span>(</span></span><span><span>'Feature flag check failed, using default behavior'</span></span><span><span>)</span></span><span><span>;</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>// Implement fallback logic</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>}</span></span></code></p><p></p>
```

### Bootstrapping Flags

Since there is a delay between initializing PostHog and fetching feature flags, feature flags are not always available immediately. This makes them unusable if you want to do something like redirecting a user to a different page based on a feature flag.

To have your feature flags available immediately, you can initialize PostHog with precomputed values until it has had a chance to fetch them. This is called bootstrapping. After the SDK fetches feature flags from PostHog, it will use those flag values instead of bootstrapped ones.

For details on how to implement bootstrapping, see our [bootstrapping guide](https://posthog.com/docs/feature-flags/bootstrapping).

### Enriched analytics

You can send enriched analytics data for feature flags, which helps uncover replays where people interact with a flag, target people who've interacted with a feature, or build cohorts of people who've viewed a feature.

To enable this, you can either use our `<PosthogFeature>` [React component](https://posthog.com/docs/libraries/react#feature-flags-react-component) (which implements this for you), or implement it on your own if you're not using react.

To implement it on your own, there are 3 things you need to do:

1.  Whenever a feature is viewed, send the `$feature_view` event with the property `feature_flag` set to the name of the flag.

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>capture</span></span><span><span>(</span></span><span><span>'$feature_view'</span></span><span><span>,</span></span><span><span> </span></span><span><span>{</span></span><span><span> </span></span><span><span>feature_flag</span></span><span><span>:</span></span><span><span> flag </span></span><span><span>}</span></span><span><span>)</span></span></code></p><p></p>
```

2.  Whenever someone interacts with a feature, send the `$feature_interaction` event with the property `feature_flag` set to the name of the flag.
3.  At the same time, set the person property `$feature_interaction/<flag-key>` to true. [Here's a code example](https://github.com/PostHog/posthog-js/blob/master/react/src/components/PostHogFeature.tsx#L48C10-L48C35).

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>capture</span></span><span><span>(</span></span><span><span>'$feature_interaction'</span></span><span><span>,</span></span><span><span> </span></span><span><span>{</span></span><span><span> </span></span><span><span>feature_flag</span></span><span><span>:</span></span><span><span> flag</span></span><span><span>,</span></span><span><span> </span></span><span><span>$set</span></span><span><span>:</span></span><span><span> </span></span><span><span>{</span></span><span><span> </span></span><span><span>[</span></span><span><span>`</span></span><span><span>$feature_interaction/</span></span><span><span>${</span></span><span><span>flag</span></span><span><span>}</span></span><span><span>`</span></span><span><span>]</span></span><span><span>:</span></span><span><span> </span></span><span><span>true</span></span><span><span> </span></span><span><span>}</span></span><span><span> </span></span><span><span>}</span></span><span><span>)</span></span></code></p><p></p>
```

[Here's a code example for the entire React component](https://github.com/PostHog/posthog-js/blob/master/react/src/components/PostHogFeature.tsx).

## Experiments (A/B tests)

Since [experiments](https://posthog.com/docs/experiments/manual) use feature flags, the code for running an experiment is very similar to the feature flags code:

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>// Ensure flags are loaded before usage.</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>// You'll only need to call this on the code the first time a user visits.</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>// See this doc for more details: https://posthog.com/docs/feature-flags/manual#ensuring-flags-are-loaded-before-usage</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>onFeatureFlags</span></span><span><span>(</span></span><span><span>function</span></span><span><span>(</span></span><span><span>)</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>// feature flags should be available at this point</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>if</span></span><span><span> </span></span><span><span>(</span></span><span><span>posthog</span></span><span><span>.</span></span><span><span>getFeatureFlag</span></span><span><span>(</span></span><span><span>'experiment-feature-flag-key'</span></span><span><span>)</span></span><span><span>  </span></span><span><span>==</span></span><span><span> </span></span><span><span>'variant-name'</span></span><span><span>)</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>        </span></span><span><span>// do something</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>}</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>}</span></span><span><span>)</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>// Otherwise, you can just do:</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>if</span></span><span><span> </span></span><span><span>(</span></span><span><span>posthog</span></span><span><span>.</span></span><span><span>getFeatureFlag</span></span><span><span>(</span></span><span><span>'experiment-feature-flag-key'</span></span><span><span>)</span></span><span><span>  </span></span><span><span>==</span></span><span><span> </span></span><span><span>'variant-name'</span></span><span><span>)</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>// do something</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>}</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>// You can also test your code by overriding the feature flag:</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>// e.g., posthog.featureFlags.overrideFeatureFlags({ flags: {'experiment-feature-flag-key': 'test'}})</span></span></code></p><p></p>
```

It's also possible to [run experiments without using feature flags](https://posthog.com/docs/experiments/running-experiments-without-feature-flags).

## Early access feature management

Early access features give you the option to release feature flags that can be controlled by your users. More information on this can be found [here](https://posthog.com/docs/feature-flags/early-access-feature-management).

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>getEarlyAccessFeatures</span></span><span><span>(</span></span><span><span>(</span></span><span><span>previewItemData</span></span><span><span>)</span></span><span><span> </span></span><span><span>=&gt;</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>// do something with early access feature</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>}</span></span><span><span>)</span></span></code></p><p></p>
```

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>updateEarlyAccessFeatureEnrollment</span></span><span><span>(</span></span><span><span>flagKey</span></span><span><span>,</span></span><span><span> </span></span><span><span>'true'</span></span><span><span>)</span></span></code></p><p></p>
```

## Group analytics

Group analytics allows you to associate the events for that person's session with a group (e.g. teams, organizations, etc.). Read the [Group Analytics](https://posthog.com/docs/user-guides/group-analytics) guide for more information.

> **Note:** This is a paid feature and is not available on the open-source or free cloud plan. Learn more [here](https://posthog.com/pricing).

-   Associate the events for this session with a group

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>group</span></span><span><span>(</span></span><span><span>'company'</span></span><span><span>,</span></span><span><span> </span></span><span><span>'company_id_in_your_db'</span></span><span><span>)</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>capture</span></span><span><span>(</span></span><span><span>'upgraded_plan'</span></span><span><span>)</span></span><span><span> </span></span><span><span>// this event is associated with company ID `company_id_in_your_db`</span></span></code></p><p></p>
```

-   Associate the events for this session with a group AND update the properties of that group

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>group</span></span><span><span>(</span></span><span><span>'company'</span></span><span><span>,</span></span><span><span> </span></span><span><span>'company_id_in_your_db'</span></span><span><span>,</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>name</span></span><span><span>:</span></span><span><span> </span></span><span><span>'Awesome Inc.'</span></span><span><span>,</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>employees</span></span><span><span>:</span></span><span><span> </span></span><span><span>11</span></span><span><span>,</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>}</span></span><span><span>)</span></span></code></p><p></p>
```

The `name` is a special property which is used in the PostHog UI for the name of the group. If you don't specify a `name` property, the group ID will be used instead.

#### Handling logging out

When the user logs out it's important to call `posthog.reset()` to avoid new events being registered under the previously active group.

#### Integrating groups with feature flags

If you have updated tracking, you can use group-based feature flags as normal.

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>if</span></span><span><span> </span></span><span><span>(</span></span><span><span>posthog</span></span><span><span>.</span></span><span><span>isFeatureEnabled</span></span><span><span>(</span></span><span><span>'new-groups-feature'</span></span><span><span>)</span></span><span><span>)</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>// do something</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>}</span></span></code></p><p></p>
```

To check flag status for a different group, first switch the active group by calling `posthog.group()`.

## Surveys

[Surveys](https://posthog.com/docs/surveys) launched with [popover presentation](https://posthog.com/docs/surveys/creating-surveys#presentation) are automatically shown to users matching the [display conditions](https://posthog.com/docs/surveys/creating-surveys#display-conditions) you set up.

You can also [render _unstyled_ surveys programmatically](https://posthog.com/docs/surveys/implementing-custom-surveys) with the `renderSurvey` method.

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>renderSurvey</span></span><span><span>(</span></span><span><span>'survey_id'</span></span><span><span>,</span></span><span><span> </span></span><span><span>'#survey-container'</span></span><span><span>)</span></span></code></p><p></p>
```

To disable loading surveys in a specific client, you can set the `disable_surveys` [config option](https://posthog.com/docs/libraries/js#config).

Surveys using the **API** presentation enable you to implement your own survey UI and use PostHog to handle display logic, capturing results, and analytics.

To implement **API** surveys, start by fetching active surveys for a user using either of the methods below:

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>// Fetch enabled surveys for the current user</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>getActiveMatchingSurveys</span></span><span><span>(</span></span><span><span>callback</span></span><span><span>,</span></span><span><span> forceReload</span></span><span><span>)</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>// Fetch all surveys</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>getSurveys</span></span><span><span>(</span></span><span><span>callback</span></span><span><span>,</span></span><span><span> forceReload</span></span><span><span>)</span></span></code></p><p></p>
```

The response returns an array of survey objects and is cached by default. To force a reload, pass `true` as the `forceReload` argument.

The survey objects look like this:

```
<p><code id="code-lang-json"></code></p><p><code id="code-lang-json"><span><span>[</span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-json"><span><span>  </span></span><span><span>"id"</span></span><span><span>:</span></span><span><span> </span></span><span><span>"your_survey_id"</span></span><span><span>,</span></span><span><span></span></span></code></p><p><code id="code-lang-json"><span><span>  </span></span><span><span>"name"</span></span><span><span>:</span></span><span><span> </span></span><span><span>"Your survey name"</span></span><span><span>,</span></span><span><span></span></span></code></p><p><code id="code-lang-json"><span><span>  </span></span><span><span>"description"</span></span><span><span>:</span></span><span><span> </span></span><span><span>"Metadata describing your survey"</span></span><span><span>,</span></span><span><span></span></span></code></p><p><code id="code-lang-json"><span><span>  </span></span><span><span>"type"</span></span><span><span>:</span></span><span><span> </span></span><span><span>"api"</span></span><span><span>,</span></span><span><span> </span></span><span><span>// either "api", "popover", or "widget"</span></span><span><span></span></span></code></p><p><code id="code-lang-json"><span><span>  </span></span><span><span>"linked_flag_key"</span></span><span><span>:</span></span><span><span> </span></span><span><span>null</span></span><span><span>,</span></span><span><span> </span></span><span><span>// linked feature flag key, if any.</span></span><span><span></span></span></code></p><p><code id="code-lang-json"><span><span>  </span></span><span><span>"targeting_flag_key"</span></span><span><span>:</span></span><span><span> </span></span><span><span>"your_survey_targeting_flag_key"</span></span><span><span>,</span></span><span><span></span></span></code></p><p><code id="code-lang-json"><span><span>  </span></span><span><span>"questions"</span></span><span><span>:</span></span><span><span> </span></span><span><span>[</span></span><span><span></span></span></code></p><p><code id="code-lang-json"><span><span>    </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-json"><span><span>      </span></span><span><span>"type"</span></span><span><span>:</span></span><span><span> </span></span><span><span>"single_choice"</span></span><span><span>,</span></span><span><span></span></span></code></p><p><code id="code-lang-json"><span><span>      </span></span><span><span>"choices"</span></span><span><span>:</span></span><span><span> </span></span><span><span>[</span></span><span><span></span></span></code></p><p><code id="code-lang-json"><span><span>        </span></span><span><span>"Yes"</span></span><span><span>,</span></span><span><span></span></span></code></p><p><code id="code-lang-json"><span><span>        </span></span><span><span>"No"</span></span><span><span></span></span></code></p><p><code id="code-lang-json"><span><span>      </span></span><span><span>]</span></span><span><span>,</span></span><span><span></span></span></code></p><p><code id="code-lang-json"><span><span>      </span></span><span><span>"question"</span></span><span><span>:</span></span><span><span> </span></span><span><span>"Are you enjoying PostHog?"</span></span><span><span></span></span></code></p><p><code id="code-lang-json"><span><span>    </span></span><span><span>}</span></span><span><span></span></span></code></p><p><code id="code-lang-json"><span><span>  </span></span><span><span>]</span></span><span><span>,</span></span><span><span></span></span></code></p><p><code id="code-lang-json"><span><span>  </span></span><span><span>"conditions"</span></span><span><span>:</span></span><span><span> </span></span><span><span>null</span></span><span><span>,</span></span><span><span></span></span></code></p><p><code id="code-lang-json"><span><span>  </span></span><span><span>"start_date"</span></span><span><span>:</span></span><span><span> </span></span><span><span>"2023-09-19T13:10:49.505000Z"</span></span><span><span>,</span></span><span><span></span></span></code></p><p><code id="code-lang-json"><span><span>  </span></span><span><span>"end_date"</span></span><span><span>:</span></span><span><span> </span></span><span><span>null</span></span><span><span></span></span></code></p><p><code id="code-lang-json"><span><span></span></span><span><span>}</span></span><span><span>]</span></span></code></p><p></p>
```

### Capturing survey events

To display survey results in PostHog, you need to capture 3 types of events:

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>// 1. When a user is shown a survey</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>capture</span></span><span><span>(</span></span><span><span>"survey shown"</span></span><span><span>,</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>$survey_id</span></span><span><span>:</span></span><span><span> survey</span></span><span><span>.</span></span><span><span>id</span></span><span><span> </span></span><span><span>// required</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>}</span></span><span><span>)</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>// 2. When a user has dismissed a survey</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>capture</span></span><span><span>(</span></span><span><span>"survey dismissed"</span></span><span><span>,</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>$survey_id</span></span><span><span>:</span></span><span><span> survey</span></span><span><span>.</span></span><span><span>id</span></span><span><span> </span></span><span><span>// required</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>}</span></span><span><span>)</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>// 3. When a user has responded to a survey</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>capture</span></span><span><span>(</span></span><span><span>"survey sent"</span></span><span><span>,</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>$survey_id</span></span><span><span>:</span></span><span><span> survey</span></span><span><span>.</span></span><span><span>id</span></span><span><span>,</span></span><span><span> </span></span><span><span>// required</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>$survey_response</span></span><span><span>:</span></span><span><span> survey_response </span></span><span><span>// required. `survey_response` must be a text value.</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>// Convert numbers to text e.g. 8 should be converted "8".</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>// For multiple choice select surveys, `survey_response` must be an array of values with the selected choices.</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>// e.g., $survey_response: ["response_1", "response_2"]</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>}</span></span><span><span>)</span></span></code></p><p></p>
```

## Session replay

To set up [session replay](https://posthog.com/docs/session-replay) in your project, all you need to do is install the JavaScript web library and enable "Record user sessions" in [your project settings](https://us.posthog.com/settings/project-replay).

For [fine-tuning control](https://posthog.com/docs/session-replay/how-to-control-which-sessions-you-record) of which sessions you record, you can use [feature flags](https://posthog.com/docs/session-replay/how-to-control-which-sessions-you-record#with-feature-flags), [sampling](https://posthog.com/docs/session-replay/how-to-control-which-sessions-you-record#sampling), [minimum duration](https://posthog.com/docs/session-replay/how-to-control-which-sessions-you-record#minimum-duration), or set the `disable_session_recording` [config option](https://posthog.com/docs/libraries/js#config) and use the following methods:

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>// Turns session recording on</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>startSessionRecording</span></span><span><span>(</span></span><span><span>)</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>// Turns session recording off</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>stopSessionRecording</span></span><span><span>(</span></span><span><span>)</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>// Check if session recording is currently running</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>sessionRecordingStarted</span></span><span><span>(</span></span><span><span>)</span></span></code></p><p></p>
```

If you are using feature flags or sampling to control which sessions you record, you can override the default behavior (and start a recording regardless) by passing the `linked_flag` or `sampling` overrides. The following would start a recording for all users, even if they don't match the flag or aren't in the sample:

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>startSessionRecording</span></span><span><span>(</span></span><span><span>{</span></span><span><span> </span></span><span><span>linked_flag</span></span><span><span>:</span></span><span><span> </span></span><span><span>true</span></span><span><span>,</span></span><span><span> </span></span><span><span>sampling</span></span><span><span>:</span></span><span><span> </span></span><span><span>true</span></span><span><span> </span></span><span><span>}</span></span><span><span>)</span></span></code></p><p></p>
```

To get the playback URL of the current session replay, you can use the following method:

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>get_session_replay_url</span></span><span><span>(</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>{</span></span><span><span> </span></span><span><span>withTimestamp</span></span><span><span>:</span></span><span><span> </span></span><span><span>true</span></span><span><span>,</span></span><span><span> </span></span><span><span>timestampLookBack</span></span><span><span>:</span></span><span><span> </span></span><span><span>30</span></span><span><span> </span></span><span><span>}</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>)</span></span></code></p><p></p>
```

It has two optional parameters:

-   `withTimestamp` (default: `false`): When set to `true`, the URL includes a timestamp that takes you to the session at the time of the event.
-   `timestampLookBack` (default: `10`): The number of seconds back the timestamp links to.

## Error tracking

You can enable [exception autocapture](https://posthog.com/docs/error-tracking/installation) in the **Autocapture & heatmaps** section of [your project settings](https://us.posthog.com/settings/project-autocapture#exception-autocapture). When enabled, this automatically captures `$exception` events when errors are thrown.

It is also possible to manually capture exceptions using the `captureException` method:

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>posthog</span></span><span><span>.</span></span><span><span>captureException</span></span><span><span>(</span></span><span><span>error</span></span><span><span>,</span></span><span><span> additionalProperties</span></span><span><span>)</span></span></code></p><p></p>
```

## Persistence

For PostHog to work optimally, we store small amount of information about the user on the user's browser. This ensures we identify users properly if they navigates away from your site and come back later. We store the following information in the user's browser:

-   User's ID
-   Session ID & Device ID
-   Active & enabled feature flags
-   Any super properties you have defined.
-   Some PostHog configuration options (e.g. whether session recording is enabled)

By default, we store all this information in both a `cookie` and `localStorage`, which means PostHog can identify your users across subdomains. By default, this cookie is set to expire after `365` days and is named with your Project API key e.g. `ph_<project_api_key>_posthog`.

If you want to change how PostHog stores this information, you can do so with the `persistence` configuration option:

-   `persistence: "localStorage+cookie"` (default): Limited things are stored in the cookie such as the distinctID and the sessionID, and everything else in the browser's [`localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).
    
-   `persistence: "cookie"` : Stores all data in a cookie.
    
-   `persistence: "localStorage"`: Stores everything in `localStorage`.
    
-   `persistence: "sessionStorage"`: Stores everything in `sessionStorage`.
    
-   `persistence: "memory"`: Stores everything in page memory, which means data is only persisted for the duration of the page view.
    

To change `persistence` values without reinitializing PostHog, you can use the `posthog.set_config()` method. This enables you to switch from memory to cookies to better comply with privacy regulations.

```
<p><code id="code-lang-javascript"></code></p><p><code id="code-lang-javascript"><span><span>const</span></span><span><span> </span></span><span><span>handleCookieConsent</span></span><span><span> </span></span><span><span>=</span></span><span><span> </span></span><span><span>(</span></span><span><span>consent</span></span><span><span>)</span></span><span><span> </span></span><span><span>=&gt;</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    posthog</span></span><span><span>.</span></span><span><span>set_config</span></span><span><span>(</span></span><span><span>{</span></span><span><span> </span></span><span><span>persistence</span></span><span><span>:</span></span><span><span> consent </span></span><span><span>===</span></span><span><span> </span></span><span><span>'yes'</span></span><span><span> </span></span><span><span>?</span></span><span><span> </span></span><span><span>'localStorage+cookie'</span></span><span><span> </span></span><span><span>:</span></span><span><span> </span></span><span><span>'memory'</span></span><span><span> </span></span><span><span>}</span></span><span><span>)</span></span><span><span>;</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span>    </span></span><span><span>localStorage</span></span><span><span>.</span></span><span><span>setItem</span></span><span><span>(</span></span><span><span>'cookie_consent'</span></span><span><span>,</span></span><span><span> consent</span></span><span><span>)</span></span><span><span>;</span></span><span><span></span></span></code></p><p><code id="code-lang-javascript"><span><span></span></span><span><span>}</span></span><span><span>;</span></span></code></p><p></p>
```

### Persistence caveats

-   Be aware that `localStorage` and `sessionStorage` can't be used across subdomains. If you have multiple sites on the same domain, you may want to consider a `cookie` option or make sure to set all super properties across each subdomain.
    
-   Due to the size limitation of cookies you may run into `431 Request Header Fields Too Large` errors (e.g. if you have a lot of feature flags). In that case, use `localStorage+cookie`.
    
-   If you don't want PostHog to store anything on the user's browser (e.g. if you want to rely on your own identification mechanism only or want completely anonymous users), you can set `disable_persistence: true` in PostHog's config. If you do this, remember to call [`posthog.identify`](https://posthog.com/docs/libraries/js#identifying-users) **every time** your app loads. If you don't, every page refresh is treated as a new and different user.
    

## Amending events before they are captured

Since version 1.187.0, when initializing the SDK, you can provide a `before_send` function. This can be used to amend or reject events before they are sent to PostHog.

> **Note:** Amending and rejecting events is advanced functionality and should be done with care. It can cause unexpected results in parts of PostHog.

### Redacting information in events

`before_send` gives you one place to edit or redact information before it is sent to PostHog.

#### Redact URLs in event properties

```
<p><code id="code-lang-typescript"></code></p><p><code id="code-lang-typescript"><span><span>posthog</span></span><span><span>.</span></span><span><span>init</span></span><span><span>(</span></span><span><span>'phc_NTxThPDPguBc7n4kSoErSdfQ1ttpgGoLjK96Xk82r6G'</span></span><span><span>,</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>    before_send</span></span><span><span>:</span></span><span><span> </span></span><span><span>(</span></span><span><span>event</span></span><span><span>:</span></span><span><span> CaptureResult </span></span><span><span>|</span></span><span><span> </span></span><span><span>null</span></span><span><span>)</span></span><span><span>:</span></span><span><span> CaptureResult </span></span><span><span>|</span></span><span><span> </span></span><span><span>null</span></span><span><span> </span></span><span><span>=&gt;</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        </span></span><span><span>if</span></span><span><span> </span></span><span><span>(</span></span><span><span>!</span></span><span><span>event</span></span><span><span>)</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>            </span></span><span><span>return</span></span><span><span> </span></span><span><span>null</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        </span></span><span><span>}</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        </span></span><span><span>// redacting URLs will be specific to your site structure</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        </span></span><span><span>function</span></span><span><span> </span></span><span><span>redactUrl</span></span><span><span>(</span></span><span><span>value</span></span><span><span>:</span></span><span><span> </span></span><span><span>string</span></span><span><span>)</span></span><span><span>:</span></span><span><span> </span></span><span><span>string</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>            </span></span><span><span>return</span></span><span><span> value</span></span><span><span>.</span></span><span><span>replace</span></span><span><span>(</span></span><span><span>/</span></span><span><span id="code-lang-regex">project\/\d+</span></span><span><span>/</span></span><span><span>,</span></span><span><span> </span></span><span><span>'project/1234567'</span></span><span><span>)</span></span><span><span>;</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        </span></span><span><span>}</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        </span></span><span><span>function</span></span><span><span> </span></span><span><span>redactObject</span></span><span><span>(</span></span><span><span>objectToRedact</span></span><span><span>:</span></span><span><span> Record</span></span><span><span>&lt;</span></span><span><span>string</span></span><span><span>,</span></span><span><span> </span></span><span><span>any</span></span><span><span>&gt;</span></span><span><span>)</span></span><span><span>:</span></span><span><span> Record</span></span><span><span>&lt;</span></span><span><span>string</span></span><span><span>,</span></span><span><span> </span></span><span><span>any</span></span><span><span>&gt;</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>            </span></span><span><span>return</span></span><span><span> Object</span></span><span><span>.</span></span><span><span>entries</span></span><span><span>(</span></span><span><span>objectToRedact</span></span><span><span>)</span></span><span><span>.</span></span><span><span>reduce</span></span><span><span>(</span></span><span><span>(</span></span><span><span>acc</span></span><span><span>,</span></span><span><span> </span></span><span><span>[</span></span><span><span>key</span></span><span><span>,</span></span><span><span> value</span></span><span><span>]</span></span><span><span>)</span></span><span><span> </span></span><span><span>=&gt;</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>                </span></span><span><span>const</span></span><span><span> redactedValue </span></span><span><span>=</span></span><span><span> key</span></span><span><span>.</span></span><span><span>includes</span></span><span><span>(</span></span><span><span>"url"</span></span><span><span>)</span></span><span><span> </span></span><span><span>&amp;&amp;</span></span><span><span> </span></span><span><span>typeof</span></span><span><span> value </span></span><span><span>===</span></span><span><span> </span></span><span><span>"string"</span></span><span><span> </span></span><span><span>?</span></span><span><span> </span></span><span><span>redactUrl</span></span><span><span>(</span></span><span><span>value</span></span><span><span>)</span></span><span><span> </span></span><span><span>:</span></span><span><span> value</span></span><span><span>;</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>                acc</span></span><span><span>[</span></span><span><span>redactUrl</span></span><span><span>(</span></span><span><span>key</span></span><span><span>)</span></span><span><span>]</span></span><span><span> </span></span><span><span>=</span></span><span><span> redactedValue</span></span><span><span>;</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>                </span></span><span><span>return</span></span><span><span> acc</span></span><span><span>;</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>            </span></span><span><span>}</span></span><span><span>,</span></span><span><span> </span></span><span><span>{</span></span><span><span>}</span></span><span><span>)</span></span><span><span>;</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        </span></span><span><span>}</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        </span></span><span><span>const</span></span><span><span> redactedProperties </span></span><span><span>=</span></span><span><span> </span></span><span><span>redactObject</span></span><span><span>(</span></span><span><span>event</span></span><span><span>.</span></span><span><span>properties </span></span><span><span>||</span></span><span><span> </span></span><span><span>{</span></span><span><span>}</span></span><span><span>)</span></span><span><span>;</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        event</span></span><span><span>.</span></span><span><span>properties </span></span><span><span>=</span></span><span><span> redactedProperties</span></span></code></p><p><code id="code-lang-typescript"><span><span>        </span></span><span><span>if</span></span><span><span> </span></span><span><span>(</span></span><span><span>event</span></span><span><span>.</span></span><span><span>event </span></span><span><span>===</span></span><span><span> </span></span><span><span>'$$heatmap'</span></span><span><span>)</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>            </span></span><span><span>// $heatmap data is keyed by url</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>            event</span></span><span><span>.</span></span><span><span>properties</span></span><span><span>.</span></span><span><span>$heatmap_data </span></span><span><span>=</span></span><span><span> </span></span><span><span>redactObject</span></span><span><span>(</span></span><span><span>event</span></span><span><span>.</span></span><span><span>properties</span></span><span><span>.</span></span><span><span>$heatmap_data </span></span><span><span>||</span></span><span><span> </span></span><span><span>{</span></span><span><span>}</span></span><span><span>)</span></span><span><span>;</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        </span></span><span><span>}</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        </span></span><span><span>const</span></span><span><span> redactedSet </span></span><span><span>=</span></span><span><span> </span></span><span><span>redactObject</span></span><span><span>(</span></span><span><span>event</span></span><span><span>.</span></span><span><span>$set </span></span><span><span>||</span></span><span><span> </span></span><span><span>{</span></span><span><span>}</span></span><span><span>)</span></span><span><span>;</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        event</span></span><span><span>.</span></span><span><span>$set </span></span><span><span>=</span></span><span><span> redactedSet</span></span></code></p><p><code id="code-lang-typescript"><span><span>        </span></span><span><span>const</span></span><span><span> redactedSetOnce </span></span><span><span>=</span></span><span><span> </span></span><span><span>redactObject</span></span><span><span>(</span></span><span><span>event</span></span><span><span>.</span></span><span><span>$set_once </span></span><span><span>||</span></span><span><span> </span></span><span><span>{</span></span><span><span>}</span></span><span><span>)</span></span><span><span>;</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        event</span></span><span><span>.</span></span><span><span>$set_once </span></span><span><span>=</span></span><span><span> redactedSetOnce</span></span></code></p><p><code id="code-lang-typescript"><span><span>        </span></span><span><span>return</span></span><span><span> event</span></span></code></p><p><code id="code-lang-typescript"><span><span>    </span></span><span><span>}</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span></span></span><span><span>}</span></span><span><span>)</span></span></code></p><p></p>
```

#### Redact person properties in $set or $set\_once

```
<p><code id="code-lang-typescript"></code></p><p><code id="code-lang-typescript"><span><span>posthog</span></span><span><span>.</span></span><span><span>init</span></span><span><span>(</span></span><span><span>'phc_NTxThPDPguBc7n4kSoErSdfQ1ttpgGoLjK96Xk82r6G'</span></span><span><span>,</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>    before_send</span></span><span><span>:</span></span><span><span> </span></span><span><span>(</span></span><span><span>event</span></span><span><span>:</span></span><span><span> CaptureResult </span></span><span><span>|</span></span><span><span> </span></span><span><span>null</span></span><span><span>)</span></span><span><span>:</span></span><span><span> CaptureResult </span></span><span><span>|</span></span><span><span> </span></span><span><span>null</span></span><span><span> </span></span><span><span>=&gt;</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        </span></span><span><span>if</span></span><span><span> </span></span><span><span>(</span></span><span><span>!</span></span><span><span>event</span></span><span><span>)</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>            </span></span><span><span>return</span></span><span><span> </span></span><span><span>null</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        </span></span><span><span>}</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        event</span></span><span><span>.</span></span><span><span>$set </span></span><span><span>=</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>            </span></span><span><span>...</span></span><span><span>event</span></span><span><span>.</span></span><span><span>$set</span></span><span><span>,</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>            name</span></span><span><span>:</span></span><span><span> </span></span><span><span>'secret name'</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        </span></span><span><span>}</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        event</span></span><span><span>.</span></span><span><span>$set_once </span></span><span><span>=</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>            </span></span><span><span>...</span></span><span><span>event</span></span><span><span>.</span></span><span><span>$set_once</span></span><span><span>,</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>            initial_name</span></span><span><span>:</span></span><span><span> </span></span><span><span>'secret name'</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        </span></span><span><span>}</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        </span></span><span><span>return</span></span><span><span> event</span></span></code></p><p><code id="code-lang-typescript"><span><span>    </span></span><span><span>}</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span></span></span><span><span>}</span></span><span><span>)</span></span></code></p><p></p>
```

### Sampling events

Sampling lets you choose to send only a percentage of events to PostHog. It is a good way to control your costs without having to completely turn off features of the SDK.

Some functions of PostHog - for example much of web analytics - relies on receiving all events. Sampling `$pageview` or `$pageleave` events in particular can cause unexpected results.

#### Sampling events using our provided customization

We offer a pre-built function to sample by event name. You can import this using a package manager, or add the customization script to your site.

```
<p><code id="code-lang-typescript"></code></p><p><code id="code-lang-typescript"><span><span>import</span></span><span><span> </span></span><span><span>{</span></span><span><span> sampleByEvent </span></span><span><span>}</span></span><span><span> </span></span><span><span>from</span></span><span><span> </span></span><span><span>'posthog-js/lib/src/customizations'</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>posthog</span></span><span><span>.</span></span><span><span>init</span></span><span><span>(</span></span><span><span>'phc_NTxThPDPguBc7n4kSoErSdfQ1ttpgGoLjK96Xk82r6G'</span></span><span><span>,</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>    </span></span><span><span>// capture only half of dead click and web vitals events</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>    before_send</span></span><span><span>:</span></span><span><span> </span></span><span><span>sampleByEvent</span></span><span><span>(</span></span><span><span>[</span></span><span><span>'$dead_click'</span></span><span><span>,</span></span><span><span> </span></span><span><span>'$web_vitals'</span></span><span><span>]</span></span><span><span>,</span></span><span><span> </span></span><span><span>0.5</span></span><span><span>)</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span></span></span><span><span>}</span></span><span><span>)</span></span></code></p><p></p>
```

#### Sampling events using a custom function

```
<p><code id="code-lang-typescript"></code></p><p><code id="code-lang-typescript"><span><span>posthog</span></span><span><span>.</span></span><span><span>init</span></span><span><span>(</span></span><span><span>'phc_NTxThPDPguBc7n4kSoErSdfQ1ttpgGoLjK96Xk82r6G'</span></span><span><span>,</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>    before_send</span></span><span><span>:</span></span><span><span> </span></span><span><span>(</span></span><span><span>event</span></span><span><span>:</span></span><span><span> CaptureResult </span></span><span><span>|</span></span><span><span> </span></span><span><span>null</span></span><span><span>)</span></span><span><span>:</span></span><span><span> CaptureResult </span></span><span><span>|</span></span><span><span> </span></span><span><span>null</span></span><span><span> </span></span><span><span>=&gt;</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        </span></span><span><span>if</span></span><span><span> </span></span><span><span>(</span></span><span><span>!</span></span><span><span>event</span></span><span><span>)</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>            </span></span><span><span>return</span></span><span><span> </span></span><span><span>null</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        </span></span><span><span>}</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        </span></span><span><span>let</span></span><span><span> sampleRate </span></span><span><span>=</span></span><span><span> </span></span><span><span>1.0</span></span><span><span> </span></span><span><span>// default to always returning the event</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        </span></span><span><span>if</span></span><span><span> </span></span><span><span>(</span></span><span><span>event</span></span><span><span>.</span></span><span><span>event </span></span><span><span>===</span></span><span><span> </span></span><span><span>'$heatmap'</span></span><span><span>)</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>            sampleRate </span></span><span><span>=</span></span><span><span> </span></span><span><span>0.1</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        </span></span><span><span>}</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        </span></span><span><span>if</span></span><span><span> </span></span><span><span>(</span></span><span><span>event</span></span><span><span>.</span></span><span><span>event </span></span><span><span>===</span></span><span><span> </span></span><span><span>'$dead_click'</span></span><span><span>)</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>            sampleRate </span></span><span><span>=</span></span><span><span> </span></span><span><span>0.01</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        </span></span><span><span>}</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        </span></span><span><span>return</span></span><span><span> Math</span></span><span><span>.</span></span><span><span>random</span></span><span><span>(</span></span><span><span>)</span></span><span><span> </span></span><span><span>&lt;</span></span><span><span> sampleRate </span></span><span><span>?</span></span><span><span> event </span></span><span><span>:</span></span><span><span> </span></span><span><span>null</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>    </span></span><span><span>}</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span></span></span><span><span>}</span></span><span><span>)</span></span></code></p><p></p>
```

#### Sampling to receive only 40% of events by person distinct ID

A particular distinct ID will always either send all events or no events.

You can import this using a package manager, or add the customization script to your site.

```
<p><code id="code-lang-typescript"></code></p><p><code id="code-lang-typescript"><span><span>import</span></span><span><span> </span></span><span><span>{</span></span><span><span> sampleByDistinctId </span></span><span><span>}</span></span><span><span> </span></span><span><span>from</span></span><span><span> </span></span><span><span>'posthog-js/lib/src/customizations'</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>posthog</span></span><span><span>.</span></span><span><span>init</span></span><span><span>(</span></span><span><span>'phc_NTxThPDPguBc7n4kSoErSdfQ1ttpgGoLjK96Xk82r6G'</span></span><span><span>,</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>    before_send</span></span><span><span>:</span></span><span><span> </span></span><span><span>sampleByDistinctId</span></span><span><span>(</span></span><span><span>0.4</span></span><span><span>)</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span></span></span><span><span>}</span></span><span><span>)</span></span></code></p><p></p>
```

#### Sampling to receive only 25% of events by session ID

A particular session ID will always either send all events or no events.

You can import this using a package manager, or add the customization script to your site.

```
<p><code id="code-lang-typescript"></code></p><p><code id="code-lang-typescript"><span><span>import</span></span><span><span> </span></span><span><span>{</span></span><span><span> sampleBySessionId </span></span><span><span>}</span></span><span><span> </span></span><span><span>from</span></span><span><span> </span></span><span><span>'posthog-js/lib/src/customizations'</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>posthog</span></span><span><span>.</span></span><span><span>init</span></span><span><span>(</span></span><span><span>'phc_NTxThPDPguBc7n4kSoErSdfQ1ttpgGoLjK96Xk82r6G'</span></span><span><span>,</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>    before_send</span></span><span><span>:</span></span><span><span> </span></span><span><span>sampleBySessionId</span></span><span><span>(</span></span><span><span>0.25</span></span><span><span>)</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span></span></span><span><span>}</span></span><span><span>)</span></span></code></p><p></p>
```

### Providing more than one before\_send function

You can provide an array of functions to be called one after the other

```
<p><code id="code-lang-typescript"></code></p><p><code id="code-lang-typescript"><span><span>posthog</span></span><span><span>.</span></span><span><span>init</span></span><span><span>(</span></span><span><span>'phc_NTxThPDPguBc7n4kSoErSdfQ1ttpgGoLjK96Xk82r6G'</span></span><span><span>,</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>    before_send</span></span><span><span>:</span></span><span><span> </span></span><span><span>[</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        </span></span><span><span>sampleByDistinctId</span></span><span><span>(</span></span><span><span>0.5</span></span><span><span>)</span></span><span><span>,</span></span><span><span> </span></span><span><span>// only half of people</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        </span></span><span><span>sampleByEvent</span></span><span><span>(</span></span><span><span>[</span></span><span><span>'$web_vitals'</span></span><span><span>]</span></span><span><span>,</span></span><span><span> </span></span><span><span>0.1</span></span><span><span>)</span></span><span><span>,</span></span><span><span> </span></span><span><span>// and they capture all events except 10% of web vitals</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        </span></span><span><span>sampleByEvent</span></span><span><span>(</span></span><span><span>[</span></span><span><span>'$$heatmap'</span></span><span><span>]</span></span><span><span>,</span></span><span><span> </span></span><span><span>0.5</span></span><span><span>)</span></span><span><span>,</span></span><span><span> </span></span><span><span>// and 50% of heatmaps</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>    </span></span><span><span>]</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span></span></span><span><span>}</span></span><span><span>)</span></span></code></p><p></p>
```

### Or send no events while developing

When working locally it can be useful to see what posthog would do, without actually sending the data to PostHog

```
<p><code id="code-lang-typescript"></code></p><p><code id="code-lang-typescript"><span><span>posthog</span></span><span><span>.</span></span><span><span>init</span></span><span><span>(</span></span><span><span>'phc_NTxThPDPguBc7n4kSoErSdfQ1ttpgGoLjK96Xk82r6G'</span></span><span><span>,</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>    before_send</span></span><span><span>:</span></span><span><span> </span></span><span><span>(</span></span><span><span>event</span></span><span><span>:</span></span><span><span> CaptureResult </span></span><span><span>|</span></span><span><span> </span></span><span><span>null</span></span><span><span>)</span></span><span><span>:</span></span><span><span> CaptureResult </span></span><span><span>|</span></span><span><span> </span></span><span><span>null</span></span><span><span> </span></span><span><span>=&gt;</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        </span></span><span><span>if</span></span><span><span> </span></span><span><span>(</span></span><span><span>event</span></span><span><span>)</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>            </span></span><span><span>console</span></span><span><span>.</span></span><span><span>log</span></span><span><span>(</span></span><span><span>'posthog event: '</span></span><span><span> </span></span><span><span>+</span></span><span><span> event</span></span><span><span>.</span></span><span><span>event</span></span><span><span>,</span></span><span><span> event</span></span><span><span>)</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        </span></span><span><span>}</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        </span></span><span><span>return</span></span><span><span> </span></span><span><span>null</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>    </span></span><span><span>}</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span></span></span><span><span>}</span></span><span><span>)</span></span></code></p><p></p>
```

## Config

When calling `posthog.init`, there are various configuration options you can set in addition to `loaded` and `api_host`.

To configure these options, pass them as an object to the `posthog.init` call, like so:

```
<p><code id="code-lang-typescript"></code></p><p><code id="code-lang-typescript"><span><span>posthog</span></span><span><span>.</span></span><span><span>init</span></span><span><span>(</span></span><span><span>'phc_NTxThPDPguBc7n4kSoErSdfQ1ttpgGoLjK96Xk82r6G'</span></span><span><span>,</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>    api_host</span></span><span><span>:</span></span><span><span> </span></span><span><span>'https://us.i.posthog.com'</span></span><span><span>,</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>    </span></span><span><span>loaded</span></span><span><span>:</span></span><span><span> </span></span><span><span>function</span></span><span><span> </span></span><span><span>(</span></span><span><span>posthog</span></span><span><span>)</span></span><span><span> </span></span><span><span>{</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>        posthog</span></span><span><span>.</span></span><span><span>identify</span></span><span><span>(</span></span><span><span>'[user unique id]'</span></span><span><span>)</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>    </span></span><span><span>}</span></span><span><span>,</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>    autocapture</span></span><span><span>:</span></span><span><span> </span></span><span><span>false</span></span><span><span>,</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>    </span></span><span><span>// ... more options</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span></span></span><span><span>}</span></span><span><span>)</span></span></code></p><p></p>
```

There are multiple different configuration options, most of which you do not have to ever worry about. For brevity, only the most relevant ones are used here. However you can view all the configuration options in [the SDK's source code](https://github.com/PostHog/posthog-js/blob/921f5cfbfb0b33c1f862e81f99e0763d08ee69af/src/types.ts#L142-L254).

Some of the most relevant options are:

| Attribute | Description |
| --- | --- |
| `api_host`
**Type:** String  
**Default:** `https://us.i.posthog.com`

 | URL of your PostHog instance. |
| `ui_host`

**Type:** String  
**Default:** undefined

 | If using a [reverse proxy](https://posthog.com/docs/advanced/proxy) for `api_host` then this should be the actual PostHog app URL (e.g. [https://us.posthog.com](https://us.posthog.com/)). This ensures that links to PostHog point to the correct host. |
| `autocapture`

**Type:** Boolean or AutocaptureConfig  
**Default:** `true`

 | Determines if PostHog should [autocapture](https://posthog.com/docs/libraries/js#autocapture) events. This setting does not affect capturing pageview events (see `capture_pageview`). [See below for `AutocaptureConfig`](https://posthog.com/docs/libraries/js#autocaptureconfig)) |
| `before_send`

**Type:** Function  
**Default:** `function () {}`

 | A function that allows you to amend or reject events before they are sent to PostHog. [See below for more information](https://posthog.com/docs/libraries/js#amending-events-before-they-are-captured) |
| `bootstrap`

**Type:** Object  
**Default:** `{}`

 | An object containing the `distinctID`, `isIdentifiedID`, and `featureFlags` keys, where `distinctID` is a string, and `featureFlags` is an object of key-value pairs |
| `capture_pageview`

**Type:** Boolean  
**Default:** `true`

 | Determines if PostHog should automatically capture pageview events. |
| `capture_pageleave`

**Type:** Boolean  
**Default:** `true`

 | Determines if PostHog should automatically capture pageleave events. |
| `capture_dead_clicks`

**Type:** Boolean  
**Default:** `true`

 | Determines if PostHog should automatically capture dead click events. |
| `cross_subdomain_cookie`

**Type:** Boolean  
**Default:** `true`

 | Determines if cookie should be set on the top level domain (example.com). If PostHog-js is loaded on a subdomain (test.example.com), _and_ `cross_subdomain_cookie` is set to false, it'll set the cookie on the subdomain only (test.example.com). |
| `custom_blocked_useragents`

**Type:** Array  
**Default:** `[]`

 | A list of user agents to block when sending events. |
| `disable_persistence`

**Type:** Boolean  
**Default:** `false`

 | Disable persisting user data across pages. This will disable cookies, session storage and local storage. |
| `disable_surveys`

**Type:** Boolean  
**Default:** `false`

 | Determines if surveys script should load which controls whether they show up for users, and whether requests for API surveys return valid data |
| `disable_session_recording`

**Type:** Boolean  
**Default:** `false`

 | Determines if users should be opted out of session recording. |
| `enable_recording_console_log`

**Type:** Boolean  
**Default:** `false`

 | Determines if console logs should be recorded as part of the session recording. [More information](https://posthog.com/docs/session-replay/manual#console-logs-recording). |
| `enable_heatmaps`

**Type:** Boolean  
**Default:** undefined

 | Determines if heatmap data should be captured. |
| `loaded`

**Type:** Function  
**Default:** `function () {}`

 | A function to be called once the PostHog scripts have loaded successfully. |
| `mask_all_text`

**Type:** Boolean  
**Default:** `false`

 | Prevent PostHog autocapture from capturing any text from your elements. |
| `mask_all_element_attributes`

**Type:** Boolean  
**Default:** `false`

 | Prevent PostHog autocapture from capturing any attributes from your elements. |
| `opt_out_capturing_by_default`

**Type:** Boolean  
**Default:** `false`

 | Determines if users should be opted out of PostHog tracking by default, requiring additional logic to opt them into capturing by calling `posthog.opt_in_capturing`. |
| `opt_out_persistence_by_default`

**Type:** Boolean  
**Default:** `false`

 | Determines if users should be opted out of browser data storage by this PostHog instance by default, requiring additional logic to opt them into capturing by calling `posthog.opt_in_capturing`. |
| `persistence`

**Type:** `localStorage` or `sessionStorage` or `cookie` or `memory` or `localStorage+cookie`  
**Default:** `localStorage+cookie`

 | Determines how PostHog stores information about the user. See [persistence](https://posthog.com/docs/libraries/js#persistence) for details. |
| `property_denylist`

**Type:** Array  
**Default:** `[]`

 | A list of properties that should never be sent with `capture` calls. |
| `person_profiles`

**Type:** Enum: `always`, `identified_only`  
**Default:** `identified_only`

 | Set whether events should capture identified events and process person profiles |
| `rate_limiting`

**Type:** Object  
**Default:** `{ events_per_second: 10, events_burst_limit: events_per_second * 10 }`

 | Controls event rate limiting to help you avoid accidentally sending too many events. `events_per_second` determines how many events can be sent per second on average (default: 10). `events_burst_limit` sets the maximum events that can be sent at once (default: 10 times the `events_per_second` value). |
| `session_recording`

**Type:** Object  
**Default:** [See here.](https://github.com/PostHog/posthog-js/blob/96fa9339b9c553a1c69ec5db9d282f31a65a1c25/src/posthog-core.js#L1032)

 | Configuration options for recordings. More details [found here](https://posthog.com/docs/session-replay/manual) |
| `session_idle_timeout_seconds`

**Type:** Integer  
**Default:** `1800`

 | The maximum amount of time a session can be inactive before it is split into a new session. |
| `xhr_headers`

**Type:** Object  
**Default:** `{}`

 | Any additional headers you wish to pass with the XHR requests to the PostHog API. |

### AutocaptureConfig

The `autocapture` config takes an object providing full control of autocapture's behavior.

| Attribute | Description |
| --- | --- |
| `url_allowlist`
**Type:** Array of Strings or Regexp  
**Default:** `undefined`

 | List of URLs to enable autocapture on, can be string or regex matches e.g. `['https://example.com', 'test.com/.*']`. An empty list means no URLs are allowed for capture, `undefined` means all URLs are. |
| `dom_event_allowlist`

**Type:** Array of Strings  
**Default:** `undefined`

 | An array of DOM events, like 'click', 'change', 'submit', to enable autocapture on. An empty array means no events are enable for capture, `undefined` means all are. |
| `element_allowlist`

**Type:** Array of Strings  
**Default:** `undefined`

 | An array of DOM elements, like 'a', 'button', 'form', 'input', 'select', 'textarea', or 'label', to allow autocapture on. An empty array means no elements are enabled for capture, `undefined` means all elements are enabled. |
| `css_selector_allowlist`

**Type:** Array of Strings  
**Default:** `undefined`

 | An array of CSS selectors to enable autocapture on. An empty array means no CSS selectors are allowed for capture, `undefined` means all CSS selectors are. |
| `element_attribute_ignorelist`

**Type:** Array of Strings  
**Default:** `undefined`

 | An array of element attributes that autocapture will not capture. Both an empty array and `undefined` mean any of the attributes from the element are captured. |
| `capture_copied_text`

**Type:** Boolean  
**Default:** `false`

 | When set to true, autocapture will capture the text of any element that is cut or copied. |

### Advanced configuration

In this section we describe some additional details on advanced configuration available.

| Attribute | Description |
| --- | --- |
| `advanced_disable_decide`
**Type:** Boolean  
**Default:** `false`

 | Will completely disable the `/decide` endpoint request (and features that rely on it). More details below. |
| `advanced_disable_feature_flags`

**Type:** Boolean  
**Default:** `false`

 | Will keep `/decide` running, but without any feature flag requests. Important: do not use this argument if using surveys, as display conditions rely on feature flags internally. |
| `advanced_disable_feature_flags_on_first_load`

**Type:** Boolean  
**Default:** `false`

 | Stops from firing feature flag requests on first page load. Only requests feature flags when user identity or properties are updated, or you manually request for flags to be loaded. |
| `feature_flag_request_timeout_ms`

**Type:** Integer  
**Default:** `3000`

 | Sets timeout for fetching feature flags |
| `secure_cookie`

**Type:** Boolean  
**Default:** `false`

 | If this is `true`, PostHog cookies will be marked as secure, meaning they will only be transmitted over HTTPS. |
| `custom_campaign_params`

**Type:** Array  
**Default:** `[]`

 | List of query params to be automatically captured (see [UTM Segmentation](https://posthog.com/docs/data/utm-segmentation) ) |
| `fetch_options.cache`

**Type:** string  
**Default:** `undefined`

 | `fetch` call cache behavior (see [MDN Docs](https://posthog.com/docs/libraries/cache_docs) to understand available options). It's important when using NextJS, see [companion documentation](https://posthog.com/docs/libraries/nextjs_documentation). This is a tricky option, avoid using it unless you are aware of the changes this could cause - such as cached feature flag values, etc. |
| `fetch_options.next_options`

**Type:** Object  
**Default:** `undefined`

 | Arguments to be passed to the `next` key when calling `fetch` under NextJS. See [companion documentation](https://posthog.com/docs/libraries/nextjs_options). |

> These are features for advanced users and may lead to unintended side effects if not reviewed carefully. If you are unsure about something, just [reach out](https://posthog.com/slack).

### Disable `/decide` endpoint

> This feature was introduced in posthog-js 1.10.0. Previously, disabling autocapture would inherently disable the /decide endpoint altogether. This meant that disabling autocapture would inadvertenly turn off session recording, feature flags, compression and the toolbar too.

One of the very first things the PostHog library does when `init()` is called is make a request to the `/decide` endpoint on PostHog's backend. This endpoint contains information on how to run the PostHog library so events are properly received in the backend. This endpoint is required to run most features of the library (detailed below). However, if you're not using any of the described features, you may wish to turn off the call completely to avoid an extra request and reduce resource usage on both the client and the server.

The `/decide` endpoint can be disabled by setting `advanced_disable_decide = true` in PostHog config.

**Resources dependent on `/decide`**

> These are features/resources that will be fully disabled when the /decide endpoint is disabled.

-   **Autocapture**. The `/decide` endpoint contains information on whether autocapture should be enabled or not (apart from local configuration).
-   **Session recording**. The endpoint contains information on where to send relevant session recording events.
-   **Compression**. The endpoint contains information on what compression methods are supported on the backend (e.g. LZ64, gzip) for event payloads.
-   **Feature flags**. The endpoint contains the feature flags enabled for the current person.
-   **Surveys**. The endpoint contains information on whether surveys should be enabled or not.
-   **Toolbar**. The endpoint contains authentication information and other toolbar capabilities information required to run it.

Any custom event capturing (`posthog.capture`), `$identify`, `$set`, `$set_once` and basically any other calls not detailed above will work as expected when `/decide` is disabled.

### Running more than one instance of PostHog at the same time

While not a first-class citizen, PostHog allows you to run more than one instance of PostHog at the same if you, for example, want to track different events in different posthog instances/projects.

`posthog.init` accepts a third parameter that can be used to create named instances.

```
<p><code id="code-lang-typescript"></code></p><p><code id="code-lang-typescript"><span><span>posthog</span></span><span><span>.</span></span><span><span>init</span></span><span><span>(</span></span><span><span>'phc_NTxThPDPguBc7n4kSoErSdfQ1ttpgGoLjK96Xk82r6G'</span></span><span><span>,</span></span><span><span> </span></span><span><span>{</span></span><span><span>}</span></span><span><span>,</span></span><span><span> </span></span><span><span>'organization1'</span></span><span><span>)</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>posthog</span></span><span><span>.</span></span><span><span>init</span></span><span><span>(</span></span><span><span>'&lt;ph_project_api_key&gt;'</span></span><span><span>,</span></span><span><span> </span></span><span><span>{</span></span><span><span>}</span></span><span><span>,</span></span><span><span> </span></span><span><span>'organization2'</span></span><span><span>)</span></span></code></p><p></p>
```

You can then call these different instances by accessing it on the global `posthog` object

```
<p><code id="code-lang-typescript"></code></p><p><code id="code-lang-typescript"><span><span>posthog</span></span><span><span>.</span></span><span><span>organization1</span></span><span><span>.</span></span><span><span>capture</span></span><span><span>(</span></span><span><span>"some_event"</span></span><span><span>)</span></span><span><span></span></span></code></p><p><code id="code-lang-typescript"><span><span>posthog</span></span><span><span>.</span></span><span><span>organization2</span></span><span><span>.</span></span><span><span>capture</span></span><span><span>(</span></span><span><span>"other_event"</span></span><span><span>)</span></span></code></p><p></p>
```

> **Note:** You'll probably want to disable autocapture (and some other events) to avoid them from being sent to both instances. Check all of our [config options](https://posthog.com/docs/libraries/js#config) to better understand that.

## Debugging

In your dev console you can run `posthog.debug()`. This will enable debugging, easily allowing you to see all data that is being sent to PostHog.

## Development

For instructions on how to run `posthog-js` locally and setup your development environment, please checkout the README on the [posthog-js](https://github.com/PostHog/posthog-js#README) repository.
