import { Skeleton } from "@/components/ui/skeleton";

function ConversationRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
      <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-10" />
        </div>
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

function BubbleSkeleton({ right = false }: { right?: boolean }) {
  return (
    <div className={`flex ${right ? "justify-end" : "justify-start"}`}>
      <Skeleton className={`h-10 rounded-2xl ${right ? "w-48" : "w-56"}`} />
    </div>
  );
}

export default function MessagesLoading() {
  return (
    <div className="flex h-full">
      {/* Conversation list */}
      <div className="hidden sm:flex w-80 lg:w-96 shrink-0 flex-col border-r border-gray-100 bg-white">
        <div className="p-4 border-b border-gray-100 space-y-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-9 w-full rounded-xl" />
        </div>
        <div className="flex-1 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => <ConversationRowSkeleton key={i} />)}
        </div>
      </div>

      {/* Chat thread */}
      <div className="flex flex-1 flex-col bg-gray-50">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>

        {/* Bubbles */}
        <div className="flex-1 overflow-hidden px-4 py-5 space-y-4">
          <BubbleSkeleton />
          <BubbleSkeleton right />
          <BubbleSkeleton />
          <BubbleSkeleton right />
          <BubbleSkeleton />
          <BubbleSkeleton right />
        </div>

        {/* Input */}
        <div className="border-t border-gray-100 bg-white px-4 py-3 flex gap-3 items-end">
          <Skeleton className="flex-1 h-10 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
        </div>
      </div>
    </div>
  );
}
