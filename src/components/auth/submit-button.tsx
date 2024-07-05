import { useFormStatus } from "react-dom";
import { Button } from "../ui/button";
import { useEffect } from "react";
import { toast } from "sonner";
import { LuLoader } from "react-icons/lu";

const SubmitButton = () => {
  const { pending } = useFormStatus();

  useEffect(() => {
    if (pending) {
      toast(
        <div className="flex place-items-center gap-6 align-middle">
          <span className="animate-spin">
            <LuLoader />
          </span>
          Please wait...
        </div>,
        {
          dismissible: false,
          duration: 99999999,
          id: "loading-spinner",
        },
      );
    }
  }, [pending]);

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Please wait..." : "Register"}
    </Button>
  );
};

export default SubmitButton;
