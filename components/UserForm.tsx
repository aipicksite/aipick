import SubmitButton from "@/components/SubmitButton";
type Props = {
  action: (formData: FormData) => void;
  submitLabel: string;
  defaultEmail?: string;
  defaultUsername?: string;
  showPasswordRequired?: boolean;
  error?: string;
};

export default function UserForm({
  action,
  submitLabel,
  defaultEmail,
  defaultUsername,
  showPasswordRequired,
  error,
}: Props) {
  return (
    <form action={action} className="space-y-5 mt-8 max-w-md">
      {error && (
        <div className="bg-coral/10 border border-coral/30 text-coral text-sm rounded-md px-3.5 py-2.5">
          {error}
        </div>
      )}

      <div>
        <label className="text-sm font-medium block mb-1">Email</label>
        <input
          name="email"
          type="email"
          required={!defaultEmail}
          defaultValue={defaultEmail}
          className="w-full border border-line rounded px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">Username</label>
        <input
          name="username"
          defaultValue={defaultUsername}
          className="w-full border border-line rounded px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">
          {showPasswordRequired ? "Password" : "New password (leave blank to keep current)"}
        </label>
        <input
          name="password"
          type="password"
          minLength={8}
          required={showPasswordRequired}
          placeholder="At least 8 characters"
          className="w-full border border-line rounded px-3 py-2 text-sm"
        />
      </div>

      <SubmitButton
        pendingText="Saving…"
        className="bg-plum text-white text-sm font-medium px-4 py-2.5 rounded-md hover:bg-plum-deep transition-colors"
      >
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
