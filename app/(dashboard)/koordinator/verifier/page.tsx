import { redirect } from 'next/navigation';

export default function KoordinatorVerifierRootPage() {
  // If the user navigates to /koordinator/verifier without an ID,
  // redirect them to the dashboard where the list of requests is displayed.
  redirect('/koordinator/dashboard');
}
