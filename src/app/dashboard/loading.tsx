import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
    return (
        <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
                <Skeleton className="h-[30px] w-60" />
                <Skeleton className="h-[38px] w-[150px]" />
            </div>
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
                {[0, 1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardContent className="flex flex-col gap-2">
                            <Skeleton className="h-4 w-[55%]" />
                            <Skeleton className="h-7 w-24" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <Card>
                <CardContent className="flex flex-col gap-3">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-4 w-full" />
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
