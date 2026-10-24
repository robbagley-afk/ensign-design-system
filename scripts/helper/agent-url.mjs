// Per-job chat agent. Precedence: job "agent" > --agent > lanes.json agentUrl (Rob's Coding Helper).
// A value is an alias from lanes.json "agents" or a full M365 agent URL. Anything else fails before a lane is touched.
const M365 = /^https:\/\/m365\.cloud\.microsoft\/chat\/agent\/T_[0-9a-f-]+\.[0-9a-f-]+$/i;
export function resolveAgent(value, reg) {
  if (value === undefined || value === null || value === '') return { name: 'helper', url: reg.agentUrl };
  const aliases = reg.agents || {};
  if (Object.hasOwn(aliases, value)) return { name: value, url: aliases[value] };
  if (M365.test(value)) {
    const name = Object.keys(aliases).find(k => aliases[k] === value) || 'custom';
    return { name, url: value };
  }
  throw new Error(`unknown agent "${value}": use one of ${Object.keys(aliases).join(', ') || '(none)'} or a full m365.cloud.microsoft/chat/agent URL`);
}
export function agentForJob(job, cliAgent, reg) { return resolveAgent(job.agent ?? cliAgent, reg); }
