import { Icon } from "./icon.tsx";

export function AlbumBlank() {
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-sm bg-gray-300 p-2">
      <Icon className="h-full w-full text-gray-800" name="disc-3" />
      <span className="sr-only">No Album</span>
    </div>
  );
}
