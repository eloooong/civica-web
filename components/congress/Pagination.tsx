import {
  Pagination as UiPagination,
} from "@/components/ui/Pagination";

/** Compat re-export so existing congress pages keep working unchanged. */
export function Pagination(props: {
  page: number;
  total: number;
  limit: number;
  hrefFor: (page: number) => string;
}) {
  return <UiPagination {...props} />;
}
