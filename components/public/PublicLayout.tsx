import PublicFooter from "@/components/public/PublicFooter";
import PublicHeader from "@/components/public/PublicHeader";
// import ChatWidget from "@/components/public/ChatWidget"; // Hidden for now — uncomment to re-enable

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <PublicHeader />
      {children}
      <PublicFooter />
      {/* <ChatWidget /> */}
    </div>
  );
}