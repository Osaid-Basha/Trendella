import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addWishlistItem, removeWishlistItem, type NormalizedProduct } from "../lib/api";

interface WishlistButtonProps {
  productId: string;
}

export const WishlistButton = ({ productId }: WishlistButtonProps) => {
  const queryClient = useQueryClient();
  const wishlist = queryClient.getQueryData<NormalizedProduct[]>(["wishlist"]) ?? [];
  const isSaved = wishlist.some((item) => item.id === productId);

  const addMutation = useMutation({
    mutationFn: () => addWishlistItem(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    }
  });

  const removeMutation = useMutation({
    mutationFn: () => removeWishlistItem(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    }
  });

  const handleToggle = () => {
    if (isSaved) {
      removeMutation.mutate();
    } else {
      addMutation.mutate();
    }
  };

  const isLoading = addMutation.isPending || removeMutation.isPending;

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isLoading}
      className={`flex-1 rounded-full border px-4 py-2 text-sm font-medium transition ${
        isSaved
          ? "border-rose-500 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
          : "border-slate-300 text-slate-700 hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-200"
      } disabled:cursor-not-allowed disabled:opacity-60`}
      aria-pressed={isSaved}
    >
      {isSaved ? "Saved" : "Save to Wish List"}
    </button>
  );
};
