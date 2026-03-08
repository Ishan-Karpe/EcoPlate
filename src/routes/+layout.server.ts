export async function load({ locals }: { locals: App.Locals }) {
  return {
    session: locals.session,
  };
}
