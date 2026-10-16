import { startTransition, type FormEvent } from "react";

// React 19 resets a <form action={fn}> once the action settles, so an error would wipe
// what the person typed. Dispatching from onSubmit keeps the fields as they are.
export function submitWithoutReset(action: (formData: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const formData = new FormData(event.currentTarget, submitter);
    startTransition(() => action(formData));
  };
}
