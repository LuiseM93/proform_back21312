import { getUserContext } from "@/lib/user-context";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const ctx = await getUserContext();

  return (
    <div className="flex-1 flex flex-col items-center p-4 md:p-8 lg:p-margin-md">
      <div className="w-full max-w-[500px] mt-8 md:mt-12">
        <div className="mb-8 text-center md:text-left">
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-primary">
            Account Profile
          </h2>
          <p className="text-on-surface-variant mt-2">
            Manage your personal information and preferences.
          </p>
        </div>
        <ProfileForm
          fullName={ctx?.profile?.full_name || ""}
          email={ctx?.user?.email || ""}
          phone={ctx?.profile?.phone || ""}
          companyName={ctx?.company?.company_name || ""}
          plan={ctx?.subscription?.plan || "starter"}
          memberSince={ctx?.profile?.created_at || null}
        />
      </div>
    </div>
  );
}
