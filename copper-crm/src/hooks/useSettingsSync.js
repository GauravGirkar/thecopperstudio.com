import { useEffect } from "react";
import { useAuth } from "../auth/useAuth";

/**
 * useSettingsSync — keeps a settings form in sync with the AuthContext user.
 *
 * Problem it solves:
 *   Settings forms initialise their state from `user` once at mount.  When the
 *   user saves and then navigates away and back (without a full remount), the
 *   form still holds the *stale* snapshot from the first render.  This hook
 *   re-runs the sync whenever `user` changes so the form always starts from
 *   the latest persisted values.
 *
 * Usage:
 *   const { syncToContext } = useSettingsSync(setForm, (u) => ({
 *     name: u?.name || "",
 *     phone: u?.phone || "",
 *   }));
 *
 *   // After a successful API save:
 *   syncToContext(updatedUser);   // → updates AuthContext + localStorage
 *
 * @param {Function} setForm      - React setState setter for the form fields
 * @param {Function} mapUserToForm - Pure function (user) → form-field object
 * @returns {{ syncToContext: (updatedUser: object) => void }}
 */
export function useSettingsSync(setForm, mapUserToForm) {
  const { user, updateUser } = useAuth();

  // Re-sync the form fields from context whenever `user` changes.
  // This covers:
  //   1. Initial mount — same as the useState initialiser, but reactive.
  //   2. Re-visit after a save — user changed in context, form gets fresh values.
  //   3. External updates — another tab / context trigger updates the session.
  useEffect(() => {
    setForm(mapUserToForm(user));
    // mapUserToForm is defined inline by callers; include user as the real dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /**
   * Immediately propagates the server-returned user object into AuthContext
   * (and localStorage) so the rest of the app reflects the change without a
   * reload or re-login.
   *
   * @param {object|undefined} updatedUser - The `user` object from the API
   *   response.  Guard handles offline/demo mode where it may be undefined.
   */
  function syncToContext(updatedUser) {
    if (updatedUser && typeof updatedUser === "object") {
      updateUser(updatedUser);
    }
  }

  return { syncToContext };
}
