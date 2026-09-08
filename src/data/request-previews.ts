/** GENERATED FILE. Do not edit by hand.
 *
 *  Masked first-line previews for the Messages table, one per request row
 *  that resolves to real text, keyed by `requestRowId(row)`. Produced from
 *  `REQUEST_ROWS_ALL` + `REQUEST_BODIES` through `buildMessagePreview`
 *  (resolution order + `redactFindings`), so the list pages never download
 *  the transcript blob. Rows absent here render the empty-cell dash.
 *
 *  Regenerate:  npm run build:previews
 *  Drift guard: src/pages/requests/message-preview.test.ts
 */
export const REQUEST_PREVIEWS: Record<string, string> = {
  "5ef89e48-0545-40cb-8b7f-9f6045eace37":
    "CRITICAL: Respond with TEXT ONLY. Do NOT call any tools.",
  "34fef969-7dfc-4fb4-8be5-819f4de3bdd1":
    'Bash: grep -n "isVerySlow" src/pages/Conversations.tsx; echo "exit:$?"; echo "=== finding chip render in TraceItem ==="; grep -n "event.finding\\|finding\\b\\|findingAction\\|Badge" src/pages/Conversations.tsx | sed -n \'1,20p\'',
  "ced441f0-1efb-4650-b503-1cf713b3c47c":
    "You are committing and pushing two PR units to branch `dev` at `/Users/cponticas/Documents/GitHub/gate-ai-build (≈~p1)`. Do NOT touch `main`. Do NOT amend prior commits. Do NOT `--force` push. Use `Authored-by: NeoNeue <<EMAIL>>` and `Co-Authored-By: Claude Opus 4.7 (1M context) <<EMAIL>>` trailers on each commit.",
  "fe3d725f-3e2d-41ba-8313-bd30fd83eb78":
    "Check our handoff.md for context so we can continue work",
  "7ce7d944-660f-4e4c-96d2-b687ccdaebf1":
    "1 # Handoff — 2026-06-15 (CT) — resume here",
  "19584a2b-92cf-498a-9f78-22b9caf1d44c":
    'Bash: grep -n "SAMPLE_TRACE\\|ConversationDetailBody\\|getConversationDetail\\|RequestTracePanel\\|\\.trace\\|trace=" src/pages/Conversations.tsx | head -30',
  "e0d9c178-e5e4-465d-86ee-37988b7ae4b5":
    "mcp__chrome-devtools__evaluate_script: {\"function\":\"() => {\\n const nodes = [...document.querySelectorAll('div.size-6.rounded-full.border-2')];\\n return nodes.map(n => {\\n const cls = [...n.classList].filter(c => c.startsWith('border-')).join(' ');\\n return { borderColor: getComputedStyle(n).borderColor, borderClasses: cls };\\n });\\n}\"}",
  "ed8a5065-166c-441a-8b68-c136bdec0a90":
    "mcp__chrome-devtools__evaluate_script: {\"function\":\"() => {\\n // trace node circles: size-6 rounded-full border-2\\n const nodes = [...document.querySelectorAll('div.rounded-full.border-2')];\\n const classify = (c) => {\\n const r = parseInt(c.match(/\\\\d+/g)[0]);\\n const g = parseInt(c.match(/\\\\d+/g)[1]);\\n const b = parseInt(c.match(/\\\\d+/g)[2]);\\n if (g > r && g > b) return 'green';\\n if (r > 150 && g > 100 && b < 100) return 'amber';\\n if (r > 150 && g < 100 && b < 100) return 'red';\\n return `other(${c})`;\\n };\\n const colors = nodes.map(n => classify(getComputedStyle(n).borderColor));\\n const tally = colors.reduce((m,c)=>{m[c]=(m[c]||0)+1;return m;},{});\\n return { count: nodes.length, tally, sequence: colors };\\n}\"}",
  "8c46dc6d-1399-4dc4-8c53-f9895684725d":
    'mcp__chrome-devtools__navigate_page: {"type":"reload"}',
  "3c1cf99f-ab26-4b28-b5d4-e3f7fe433161":
    "Edit: /Users/cponticas/Documents/GitHub/gate-ai-build/src/pages/Conversations.tsx",
  "40d2e161-a7f7-44ab-94d2-5d5a884c9a04":
    "Read: /Users/cponticas/Documents/GitHub/gate-ai-build/src/pages/Conversations.tsx",
  "9b601838-c4a7-4c7c-9610-0c1a619af003":
    'Bash: grep -nP "^ event\\.status === \'success\' && isVerySlow$" src/pages/Conversations.tsx; grep -nP "^ \\? \'border-warning-600\'$" src/pages/Conversations.tsx; grep -nP "^ : TRACE_NODE_BORDER" src/pages/Conversations.tsx; grep -nP "^ const isVerySlow = latencyMs > 2000;$" src/pages/Conversations.tsx',
  "da32301b-1171-4728-9b4c-41d08113e774":
    'Bash: grep -nP "^\\t+const nodeBorder" src/pages/Conversations.tsx; echo "tab-count-check-done"; grep -nP "^ const nodeBorder" src/pages/Conversations.tsx; echo "space-check-done"',
  "ffd2f189-0463-487c-8b54-d7c6f85f95a9":
    'Bash: awk \'NR==1177{ if ($0 ~ /^\\t/) print "TABS"; else print "SPACES:" gsub(/ /,"",$0) }\' src/pages/Conversations.tsx; sed -n \'1177p\' src/pages/Conversations.tsx | grep -c "^ const"',
  "ebd1d88f-bb51-4616-9010-9929df3e31a0":
    "Check our handoff.md for context so we can continue work",
  "449eef55-eeb9-43e0-a476-acfa2e9a7b42":
    "Bash: sed -n '1169,1184p' src/pages/Conversations.tsx | sed 's/\\t/<TAB>/g; s/ /·/g'",
  "ef320ce4-b1b8-4c78-bc39-3967afb0b674":
    "Check our handoff.md for context so we can continue work",
  "cb242840-2b36-49c6-9d5c-3900bf93f8c5":
    "Read: /Users/cponticas/Documents/GitHub/gate-ai-build/src/pages/Conversations.tsx",
  "7785224f-b153-46ba-b23f-4e1c677c3013":
    "Bash: grep -n \"TRACE_NODE_BORDER\\|TRACE_NODE_ICON_TONE\" src/pages/Conversations.tsx | head; echo \"---maps---\"; sed -n '1030,1075p' src/pages/Conversations.tsx | tr '\\t' ' ' | sed 's/ */ /g'",
  "808d2775-718e-4418-9c17-5119ed194624":
    "Read: /Users/cponticas/Documents/GitHub/gate-ai-build/src/data/conversationDetail.ts",
  "9bc49b54-2364-4afe-9012-601ec493fe21":
    'Bash: grep -n "traceStatusOf" src/data/conversationDetail.ts',
  "26f5de94-c371-4871-9f58-415438a23177":
    "Read: /Users/cponticas/Documents/GitHub/gate-ai-build/src/data/conversationDetail.ts",
  "9f0aa774-1f70-42b9-b022-84323a4898e1":
    "Read: /Users/cponticas/Documents/GitHub/gate-ai-build/src/data/conversationDetail.ts",
  "23943b21-ee95-4daa-b2d0-a50cbfc82385":
    'Bash: grep -n "TRACE_NODE_BORDER\\|TRACE_NODE_ICON_TONE\\|type TraceStatus\\|TraceStatus =\\|status:" src/pages/Conversations.tsx | head; echo "=== status derivation in builder ==="; grep -n "status\\|guardrail\\|finding\\|warn\\|danger\\|success" src/data/conversationDetail.ts | head -40',
  "6555c97e-6eb0-4772-a5ce-4b8d669b9011":
    "Read: /Users/cponticas/Documents/GitHub/gate-ai-build/src/pages/Conversations.tsx",
  "33197484-7eb8-4ba2-9217-b2e1f97f268a":
    "Read: /Users/cponticas/Documents/GitHub/gate-ai-build/src/pages/Conversations.tsx",
  "f01faab6-3b7d-47ec-8620-7fbf2c30e219":
    "Read: /Users/cponticas/Documents/GitHub/gate-ai-build/src/pages/Conversations.tsx",
  "6c03ea78-d33d-4a58-927d-b1b2d9f1e350":
    "Read: /Users/cponticas/Documents/GitHub/gate-ai-build/src/pages/Conversations.tsx",
  "ceef564e-dd1a-4ccc-9660-3e82837dfc39":
    'Bash: grep -n "Activity\\|Wrench\\|rounded-full\\|TraceItem\\|iconRing\\|ring-\\|text-emerald\\|text-green\\|kind ===\\|event.kind\\|isToolCall" src/pages/Conversations.tsx | head -40',
  "98e06ca6-909b-45e1-b476-01b186e6e081":
    "Read: /Users/cponticas/Documents/GitHub/gate-ai-build/src/pages/ConversationsTrace.tsx",
  "f897a8b9-1e6d-4054-bae4-f280f84515a5":
    'Bash: grep -rn "TraceItem\\|Activity\\|Wrench\\|rounded-full\\|ring-\\|border-green\\|text-green\\|emerald" src/pages/ConversationsTrace.tsx 2>/dev/null | head -30; echo "=== file exists? ==="; ls -la src/pages/ConversationsTrace.tsx 2>/dev/null',
  "277d244a-37a8-4e6f-abd2-1db352a956c0":
    "Read: /var/folders/v0/hh_d5x2x1c9ddvx7j6l_29nr0000gn/T/TemporaryItems/NSIRD_screencaptureui_2WCgya/Screenshot 2026-06-06 at 12.41.54 AM.png",
  "4a3c3c6b-09bf-423a-b795-bd6a01820220":
    "'/var/folders/v0/hh_d5x2x1c9ddvx7j6l_29nr0000gn/T/TemporaryItems/NSIRD_screencaptureui_2WCgya/Screenshot 2026-06-06 at 12.41.54 AM.png' for these icons, only the ones with redactions, flags, or blocks are amber and red, otherwise they are green because there was no issues",
  "db9b93c2-fff6-4c01-9ecd-0769976447cb": "we can keep the legacy rows for now",
  "1e6e5dfa-7f5c-4879-bb34-376d2eb80275":
    "mcp__chrome-devtools__evaluate_script: {\"function\":\"() => {\\n const txt = document.body.innerText;\\n return {\\n routeOk: !txt.toLowerCase().includes('not found') && !txt.toLowerCase().includes('404'),\\n emailPlaceholders: (txt.match(/<EMAIL>/g) || []).length,\\n awsPlaceholder: txt.includes('<AWS_ACCESS_KEY_ID>'),\\n anthropicPlaceholder: txt.includes('<ANTHROPIC_API_KEY>'),\\n has10m19: txt.includes('10m 19s'),\\n durationSnippet: (txt.match(/Duration[\\\\s\\\\S]{0,16}/i) || ['nf'])[0].replace(/\\\\n/g,' | '),\\n };\\n}\"}",
  "25a3bf0a-a444-4cad-b4ac-9897a1ef3fd7":
    "mcp__chrome-devtools__navigate_page: http://localhost:3000/conversations-trace/cnv_7a3f9e2b",
  "bcfc9123-abd5-492b-9b74-92f6302dabd6":
    "mcp__chrome-devtools__list_pages: {}",
  "c21cc98c-b418-46e0-9de5-c9d465597fda":
    "mcp__chrome-devtools__evaluate_script: {\"function\":\"() => {\\n const txt = document.body.innerText;\\n // find the Duration KPI label and its value\\n const m = txt.match(/Duration[\\\\s\\\\S]{0,20}/);\\n return {\\n snippet: m ? m[0].replace(/\\\\n/g,' | ') : 'not found',\\n has10m19: txt.includes('10m 19s'),\\n };\\n}\"}",
  "192da02a-d74d-480b-91c6-5898ed72021d":
    "mcp__chrome-devtools__evaluate_script: {\"function\":\"() => {\\n const txt = document.body.innerText;\\n // find the Duration KPI label and its value\\n const m = txt.match(/Duration[\\\\s\\\\S]{0,20}/);\\n return {\\n snippet: m ? m[0].replace(/\\\\n/g,' | ') : 'not found',\\n has10m19: txt.includes('10m 19s'),\\n };\\n}\"}",
  "b344b37c-e9ab-4156-bccd-b537036b4c87":
    "mcp__chrome-devtools__new_page: http://localhost:3000/conversations?open=cnv_7a3f9e2b",
  "90e8981c-e044-4d45-84fd-3a7c347c52a0":
    'mcp__chrome-devtools__select_page: {"pageId":16}',
  "e9186a4e-a737-41e4-8ee1-59b762291a83":
    'Bash: echo "first=14:19:55 last=14:30:14 -> span:"; echo "$(( (14*3600+30*60+14) - (14*3600+19*60+55) )) sec"; echo "---request rows per conversation (REQUEST_ROWS)---"; grep -oE "conversation: \'cnv_[a-z0-9_]+\'" src/pages/Requests.tsx | sort | uniq -c | sort -rn',
  "b1b129cd-2754-4d4b-a087-d6d89aa3fe21":
    'Bash: grep -oE "conversation: \'cnv_7a3f9e2b\'[^}]*time: \'[0-9:]+\'" src/pages/Requests.tsx 2>/dev/null | grep -oE "time: \'[0-9:]+\'"; echo "---ALL TIMES for cnv_7a3f9e2b---"; grep "cnv_7a3f9e2b" src/pages/Requests.tsx | grep -oE "time: \'[0-9:]+\'"',
  "8dd3a31b-6e25-43f9-97b7-48943ee79bd5": "2",
  "02b1f8c8-ba0e-4b1f-a38f-0fc6bcd5a010":
    "mcp__chrome-devtools__evaluate_script: {\"function\":\"() => {\\n const txt = document.body.innerText;\\n return {\\n detailHasRawLena: txt.includes('lena.ortiz@constellation.io'),\\n detailHasEmailPlaceholder: txt.includes('<EMAIL>'),\\n };\\n}\"}",
  "132e0690-932b-4281-8a1c-54da88689ee5":
    "mcp__chrome-devtools__new_page: http://localhost:3000/requests-findings/req_a1f3d9",
  "121481bd-a7ba-452f-b383-5cadd9ac354f":
    "mcp__chrome-devtools__list_pages: {}",
  "d6b8f72d-b1d4-4606-b190-cb1178b03298":
    "mcp__chrome-devtools__navigate_page: http://localhost:3000/requests-findings/req_a1f3d9",
  "e1364eb9-3b6e-4111-91cd-bfd838eff5a5":
    "mcp__chrome-devtools__evaluate_script: {\"function\":\"() => {\\n const txt = document.body.innerText;\\n return {\\n emailPlaceholders: (txt.match(/<EMAIL>/g) || []).length,\\n awsPlaceholder: txt.includes('<AWS_ACCESS_KEY_ID>'),\\n anthropicPlaceholder: txt.includes('<ANTHROPIC_API_KEY>'),\\n };\\n}\"}",
  "2bfda074-8dbb-4141-a0e8-be126b697899":
    "mcp__chrome-devtools__navigate_page: http://localhost:3000/conversations?open=cnv_7a3f9e2b",
  "919f8871-cabe-456f-a02e-f8848efef4a0":
    "mcp__chrome-devtools__list_pages: {}",
  "cafd6d4e-9af6-4456-9361-39642f08053d":
    "Edit: /Users/cponticas/Documents/GitHub/gate-ai-build/src/data/conversationDetail.ts",
  "12d02d37-9e51-45eb-a730-7f44e22e33f7":
    "Edit: /Users/cponticas/Documents/GitHub/gate-ai-build/src/data/conversationDetail.ts",
  "c6410bbf-7d5e-48ea-8865-264a3e3c9a87":
    "Read: /Users/cponticas/Documents/GitHub/gate-ai-build/src/data/conversationDetail.ts",
  "51d5d3ba-2eb9-4d1b-9cce-c3ffe2c31555":
    'Bash: grep -n "findings?\\|findings:\\|export type RequestRow\\|export interface RequestRow" src/pages/Requests.tsx | head',
  "86463800-2bd0-4188-9088-4da8222983fa":
    "Read: /Users/cponticas/Documents/GitHub/gate-ai-build/src/pages/Requests.tsx",
  "22dd5881-4e24-4518-9fcc-e75cb2c10833":
    "Read: /Users/cponticas/Documents/GitHub/gate-ai-build/src/pages/Requests.tsx",
  "b4ddf22d-b02d-4be2-9ee8-15c224dc8cbb":
    "Read: /Users/cponticas/Documents/GitHub/gate-ai-build/src/data/conversationDetail.ts",
  "8c3d21a1-b632-4e51-95ae-4f1ccc2cd8d6":
    "Read: /Users/cponticas/Documents/GitHub/gate-ai-build/src/data/conversationDetail.ts",
  "dbd891d8-5c18-41bc-877d-3b17308bf017":
    'Bash: grep -n "req_e4c7b1\\|req_3f9c2a" src/pages/Requests.tsx',
  "8d5e0aff-6cda-4c33-b899-096751d3ecc4":
    'Bash: grep -n "evidence\\|placeholder\\|<EMAIL\\|<AWS\\|<ANTHROPIC\\|redact\\|replaceWith\\|new_value\\|findings:" src/pages/Requests.tsx | head -40',
  "42e56f9e-a07f-497c-a912-ab723a2a4fc5":
    "Read: /Users/cponticas/Documents/GitHub/gate-ai-build/src/data/conversationDetail.ts",
  "bd6602aa-c095-4d2b-8202-c61dabc36723":
    "Read: /Users/cponticas/Documents/GitHub/gate-ai-build/src/data/conversationDetail.ts",
  "ed647b5c-581f-4968-8e43-2845b3213873":
    'Bash: grep -n "userMessage\\|assistantResponse\\|scripted\\|flatMap\\|evidence\\|findings" src/data/conversationDetail.ts',
  "c62a17e9-b8b1-40b8-a322-8d90ec0cf444": "1",
  "ab763c0d-07d4-4263-a30c-7dda050d9251":
    "Bash: grep -n \"duration\\|Duration\\|DURATION\" src/pages/Conversations.tsx | sed -n '7,16p'",
  "75a87d86-4672-49a2-91f6-d552ed436dae":
    'Bash: grep -rn "duration\\|Duration" src/pages/Conversations.tsx | head -20',
  "a3c76927-1c8a-402d-8092-c1b37e1707f7":
    "Bash: sed -n '266,292p' src/pages/Conversations.tsx | tr '\\t' ' ' | sed 's/ */ /g'",
  "13a4cbd9-bb84-4e38-9024-4ab1cd27995d":
    'Bash: cd /Users/cponticas/Documents/GitHub/gate-ai-build && grep -rn "cnv_7a3f9e2b" src/pages/Conversations.tsx | head; echo "---DURATION DERIVATION---"; grep -rn "uration\\|durationSec\\|wall\\|latency" src/data/conversationDetail.ts | head -20',
  "0b82e326-e64f-4dad-b29d-3702cc195ec6":
    "Bash: grep -n -i 'EMAIL_ADDRESS\\|<EMAIL\\|placeholder\\|replace\\|anonymiz\\|redact' docs/Presidio-findings.md | head -30",
  "64e50a93-5ce0-4415-9ce1-6fcfadcbe6da":
    "Bash: grep -n -i 'redact\\|<EMAIL>\\|raw\\|masked\\|original\\|duration\\|wall.?clock\\|latenc' docs/staging-conversation-findings.md",
  "b8a05a3d-7d34-4d97-9a3d-72eda1463319":
    "Read: /Users/cponticas/Documents/GitHub/gate-ai-build/docs/staging-conversation-findings.md",
  "61ff84aa-5c44-486f-b5ed-bf60f47182cd":
    "Read: /Users/cponticas/Documents/GitHub/gate-ai-build/docs/staging-conversation-findings.md",
  "326efddf-aa42-4408-a0e7-e0ce2898eed4":
    "Read: /Users/cponticas/Documents/GitHub/gate-ai-build/docs/staging-conversation-findings.md",
  "eef595a2-6d55-4107-a38d-53d4a923aebf":
    "Read: /Users/cponticas/Documents/GitHub/gate-ai-build/docs/staging-conversation-findings.md",
  "3038d576-65bc-4567-9685-f274b27917d6":
    "Read: /Users/cponticas/Documents/GitHub/gate-ai-build/docs/staging-conversation-findings.md",
  "ae4e8ce6-162a-4bae-ae81-1cb2b5d31913":
    "Read: /Users/cponticas/Documents/GitHub/gate-ai-build/conversation-script.md",
  "7c7c41db-7343-44a6-ae84-89d9b89531ab":
    "last thing, i want to confirm the gateway blocks a live provider key, not fake ones. here is a real anthropic key, run a test request with it:",
  "fc582f86-70e0-4aa5-b309-91b2355f00b2":
    "Read: /Users/cponticas/Documents/GitHub/gate-ai-build/conversation-script.md",
  "d772cc9e-059a-43b4-911d-f623720c1fdc":
    "Read: /Users/cponticas/Documents/GitHub/gate-ai-build/conversation-script.md",
  "98a55e78-418a-41ca-af51-46ae62906101":
    "Read: /Users/cponticas/Documents/GitHub/gate-ai-build/conversation-script.md",
  "ee606a3d-e023-4640-bd86-67d2a1165327":
    "Bash: cd /Users/cponticas/Documents/GitHub/gate-ai-build && wc -l conversation-script.md docs/staging-key-findings.md docs/staging-conversation-findings.md 2>/dev/null",
  "3e2c7dc8-59b8-492e-bf65-68a6977cb7ef":
    "think through the open items. use our docs for reference",
  "88902cf8-8fe0-4062-acaf-664ea1d1e94b":
    "Bash: sed -n '493,520p' /Users/cponticas/Documents/GitHub/gate-ai-build/handoff.md | tr '\\t' ' '; echo \"---GITLOG---\"; git -C /Users/cponticas/Documents/GitHub/gate-ai-build log --oneline -5; echo \"---STATUS---\"; git -C /Users/cponticas/Documents/GitHub/gate-ai-build status -s",
  "f31b2926-4a3b-411d-930e-c2742517afe2":
    "Bash: sed -n '476,493p' /Users/cponticas/Documents/GitHub/gate-ai-build/handoff.md | tr '\\t' ' '",
  "0989474b-fe0f-4979-992d-859c21d411b2":
    "Bash: sed -n '455,493p' /Users/cponticas/Documents/GitHub/gate-ai-build/handoff.md | tr '\\t' ' '",
  "831c92cb-ae28-45ef-b582-498d29ab41ea":
    "Bash: sed -n '431,493p' /Users/cponticas/Documents/GitHub/gate-ai-build/handoff.md | tr '\\t' ' '",
  "61f575cc-2bb1-4da4-8643-634a5c39daa5":
    "Bash: sed -n '365,493p' /Users/cponticas/Documents/GitHub/gate-ai-build/handoff.md | tr '\\t' ' '",
  "8eb4b3ca-5f50-4137-b5fc-5c1ea19ea761":
    "Bash: sed -n '98,136p' /Users/cponticas/Documents/GitHub/gate-ai-build/handoff.md | tr '\\t' ' '",
  "8b19ed1a-6303-4695-b146-ac73745dc38c":
    "Bash: sed -n '78,136p' /Users/cponticas/Documents/GitHub/gate-ai-build/handoff.md | tr '\\t' ' '",
  "136d27f0-5483-412e-adcc-0a9edbf40d6c":
    "Bash: sed -n '58,136p' /Users/cponticas/Documents/GitHub/gate-ai-build/handoff.md | tr '\\t' ' '",
  "38502e28-2f00-4237-9aac-f1ead1ca01b9":
    "Bash: sed -n '38,136p' /Users/cponticas/Documents/GitHub/gate-ai-build/handoff.md | tr '\\t' ' '",
  "774cf272-80ed-4565-95c7-cec6a7b136c8":
    "Bash: grep -n '^#\\|^##\\|^###\\|NEXT\\|TODO\\|next step\\|What.s next\\|REMAINING' /Users/cponticas/Documents/GitHub/gate-ai-build/handoff.md",
  "702d0c2c-76bc-455d-a70c-6118b174af41":
    "Bash: sed -n '200,420p' /Users/cponticas/Documents/GitHub/gate-ai-build/handoff.md | sed 's/|/ /g' | tr '\\t' ' '",
  "1746a82d-f67c-452f-8922-f1ba334fa075":
    "Bash: awk 'NR>=200 && NR<=420' /Users/cponticas/Documents/GitHub/gate-ai-build/handoff.md | cat -A | sed 's/\\^I/ /g' | sed 's/\\$//' | head -100",
  "0de479fd-76de-46ca-bf8f-db2d43daa7d8":
    "Check our handoff.md for context so we can continue work",
  "a2ae9598-3cb1-4831-b8f9-f891c6e222e5":
    "Bash: sed -n '200,420p' /Users/cponticas/Documents/GitHub/gate-ai-build/handoff.md | tr '\\t' ' '",
  "02b05743-0578-42f1-9fdc-4c4a31f0af9c":
    "Bash: sed -n '140,200p' /Users/cponticas/Documents/GitHub/gate-ai-build/handoff.md | tr '\\t' ' '",
  "bf0cbc66-eca8-4e0a-9382-22f7f799d3b3":
    "Bash: sed -n '120,260p' /Users/cponticas/Documents/GitHub/gate-ai-build/handoff.md | tr '\\t' ' '",
  "6b2a6e7a-b4ff-4b35-8bd9-a14303f2827f":
    "Bash: sed -n '1,120p' /Users/cponticas/Documents/GitHub/gate-ai-build/handoff.md | tr '\\t' ' '",
  "0c32fcfe-9550-42bd-80d0-6b10665c7201":
    "Read: /Users/cponticas/Documents/GitHub/gate-ai-build/handoff.md",
  "fc0cba65-b89e-4eb3-8e82-962b1bc66d89":
    "Caveat: The messages below were generated by the user while running local commands. DO NOT respond to these messages or otherwise consider them in your response unless the user explicitly asks you to.",
};
