import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import * as THREE from 'three';

const Background = () => {
  // Завантажуємо текстуру фону
  const texture = useLoader(TextureLoader, '/images/dlyakazika.png');
  
  // Створюємо дуже велику площину, що точно покриє весь екран
  return (
    <mesh position={[0, 0, -500]} scale={[2000, 1200, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial 
        map={texture} 
        side={THREE.DoubleSide}
        transparent={false}
      />
    </mesh>
  );
};

export default Background;