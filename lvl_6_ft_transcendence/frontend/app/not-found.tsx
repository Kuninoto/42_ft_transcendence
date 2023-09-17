import Image from 'next/image'

export default function NotFound() {

  return (
    <div className="flex h-full place-content-center place-items-center">
      <div className="text-center">
        <p className="text-9xl mb-4">404</p>
        <p className="text-7xl mb-4">ERROR</p>
        <p className="mt-24 text-xl">
          Looks like you've entered the wrong level...
        </p>

		    <div className="mt-8 flex justify-center items-center">
            <Image
		    		  src="/sonic.gif"
		    		  alt="sonic gif"
		    		  width={128}
		    		  height={128}
		    	  />
        </div>
      </div>
    </div>
  );
}
