import Image from "next/image";
import Loader from "@/assets/loader.gif";

export default function Loading() {

    return <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw'
    }}>
        <Image src={Loader} height={150} width={150} alt="Loading..." />
    </div>
}