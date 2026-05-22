export default function ProjectLoadingScreen() {
  return (
    <div className="w-full bg-(--background) h-screen flex flex-col">
      <div className="flex justify-center items-center gap-x-1 h-10 md:h-12">
        <div className="bg-(--surface-3) w-40 rounded animate-pulse"></div>
      </div>
      <div className="flex flex-col flex-grow border border-(--border) bg-(--surface-1) rounded-lg ml-2 md:ml-0 mr-2 mb-2 p-1">
        <div className="border h-10 rounded border-[#2d3036] flex items-center justify-between px-4">
          <div className=" flex gap-x-2 items-center ">
            <div className="flex items-center rounded text-[12px] sm:text-[13px] md:text-[15px] border border-transparent  hover:border-(--border) px-2 h-7  hover:bg-(--surface-2) transition-all duration-300 bg-(--surface-3) animate-pulse"></div>
            <div className="flex h-7 items-center gap-x-1 cursor-pointer border border-(--border) px-2 rounded  hover:bg-(--surface-2) transition-all duration-300 bg-(--surface-3) animate-pulse"></div>
          </div>
          <div className="flex gap-x-2 md:gap-x-4 ">
            <div className="flex h-7 items-center gap-x-1 cursor-pointer border border-transparent  px-2 rounded hover:bg-(--surface-2) hover:border-(--border) transition-all duration-300 bg-(--surface-3) animate-pulse"></div>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto h-96 scrollbar-hide px-4 sm:px-6 lg:px-10 xl:px-20">
          <div className="my-4 sm:my-5 lg:my-10">
            <div className="h-10 w-full bg-(--surface-3) rounded animate-pulse"></div>
            <div className="my-3 h-5 w-full bg-(--surface-3) rounded animate-pulse"></div>
          </div>

          <div className="flex gap-x-2 my-5">
            <div className="h-5 w-20 bg-(--surface-3) rounded animate-pulse"></div>
            <div className="h-5 w-20 bg-(--surface-3) rounded animate-pulse"></div>
            <div className="h-5 w-20 bg-(--surface-3) rounded animate-pulse"></div>
            <div className="h-5 w-20 bg-(--surface-3) rounded animate-pulse"></div>
            <div className="h-5 w-20 bg-(--surface-3) rounded animate-pulse"></div>
          </div>

          <div className="my-5">
            <div className="h-5 w-20 bg-(--surface-3) rounded animate-pulse"></div>
          </div>

          <div className="rounded-lg">
            <div className="h-10 w-full bg-(--surface-3) rounded-t-lg  animate-pulse"></div>
            <div className="h-10 w-full bg-(--surface-3)  animate-pulse"></div>
            <div className="h-10 w-full bg-(--surface-3)  rounded-b-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
