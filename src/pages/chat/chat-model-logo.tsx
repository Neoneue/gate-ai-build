import { VendorAvatar } from "@/components/icons/vendor-avatar";
import { cn } from "@/lib/utils";
import type { ChatModel } from "./types";

/** The vendor logo, or the vendor's initials tile when it is not one Gate
 *  draws. `VendorAvatar` owns both branches, so the chat and the Models page
 *  can never draw the same vendor two ways. */
export function ChatModelLogo({
  model,
  className,
}: {
  model: Pick<ChatModel, "id" | "provider">;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        className
      )}
    >
      <VendorAvatar decorative vendor={model.provider} />
    </span>
  );
}
