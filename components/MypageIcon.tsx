import Link from "next/link";

const MypageIcon = ({ clickable = true }) => {
  const content = (
    <>
      <img className="w-7" src="/user-fill.svg" alt="my-info" />
      <p className="text-xs mt-1 text-center">My</p>
    </>
  );

  return clickable ? (
    <Link href="/mypage" className="text-4xl mt-1 cursor-pointer">
      {content}
    </Link>
  ) : (
    <div className="text-4xl mt-1 cursor-default">{content}</div>
  );
};

export default MypageIcon;
