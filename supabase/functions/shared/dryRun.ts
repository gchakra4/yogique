export function makeDryRunResult(renderedTemplate: any, request?: any, templateRow?: any) {
  return {
    ok: true,
    dry_run: true,
    rendered_template: renderedTemplate,
    request: request || null,
    template_row: templateRow || null,
  };
}

export default { makeDryRunResult };
