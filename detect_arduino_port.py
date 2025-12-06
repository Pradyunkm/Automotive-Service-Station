"""
Arduino COM Port Detector
This script helps you find which COM port your Arduino is connected to.
"""

import serial.tools.list_ports

def find_arduino_ports():
    """Scan all available serial ports and identify potential Arduino devices"""
    ports = serial.tools.list_ports.comports()
    arduino_ports = []
    all_ports = []
    
    print("=" * 60)
    print("🔍 Scanning for Serial Ports...")
    print("=" * 60)
    
    if not ports:
        print("❌ No serial ports found!")
        print("   → Make sure your Arduino is connected via USB")
        return None
    
    for i, port in enumerate(ports, 1):
        all_ports.append(port.device)
        print(f"\n📍 Port {i}: {port.device}")
        print(f"   Description: {port.description}")
        print(f"   Hardware ID: {port.hwid}")
        
        # Check if it's likely an Arduino
        description_lower = port.description.lower()
        hwid_lower = port.hwid.lower()
        
        if any(keyword in description_lower for keyword in ['arduino', 'ch340', 'usb serial', 'ftdi']):
            arduino_ports.append(port.device)
            print(f"   ✅ LIKELY ARDUINO DETECTED!")
        elif any(keyword in hwid_lower for keyword in ['arduino', 'ch340', '2341:']):  # 2341 is Arduino's USB VID
            arduino_ports.append(port.device)
            print(f"   ✅ ARDUINO USB ID DETECTED!")
    
    print("\n" + "=" * 60)
    
    if arduino_ports:
        print(f"✅ Found {len(arduino_ports)} potential Arduino port(s):")
        for port in arduino_ports:
            print(f"   • {port}")
        print(f"\n📝 Update api.py line 275 to:")
        print(f'   SERIAL_PORT = "{arduino_ports[0]}"')
    else:
        print("⚠️  No Arduino detected, but found these ports:")
        for port in all_ports:
            print(f"   • {port}")
        print(f"\n💡 Try each port manually in api.py")
    
    print("=" * 60)
    return arduino_ports[0] if arduino_ports else all_ports[0] if all_ports else None

def test_serial_connection(port, baud_rate=9600, timeout=2):
    """Test if we can read data from the specified port"""
    try:
        print(f"\n🔌 Testing connection to {port}...")
        print(f"   Baud Rate: {baud_rate}")
        print(f"   Timeout: {timeout}s")
        print("   Waiting for data... (Press Ctrl+C to stop)\n")
        
        with serial.Serial(port, baud_rate, timeout=timeout) as ser:
            print(f"✅ Connected to {port}!")
            print("📥 Reading data:\n")
            print("-" * 60)
            
            # Read a few lines
            for i in range(10):
                if ser.in_waiting:
                    line = ser.readline().decode('utf-8', errors='ignore').strip()
                    if line:
                        print(f"   {line}")
            
            print("-" * 60)
            print(f"\n✅ Successfully reading from {port}!")
            return True
    except serial.SerialException as e:
        print(f"❌ Failed to connect to {port}")
        print(f"   Error: {e}")  
        return False
    except KeyboardInterrupt:
        print("\n⚠️  Test interrupted by user")
        return False

if __name__ == "__main__":
    print("""
    ╔══════════════════════════════════════════════════════════╗
    ║       Arduino COM Port Detector & Tester                 ║
    ║       Automotive Service Station Project                 ║
    ╚══════════════════════════════════════════════════════════╝
    """)
    
    # Find Arduino ports
    detected_port = find_arduino_ports()
    
    if detected_port:
        print(f"\n❓ Would you like to test {detected_port}? (y/n): ", end="")
        try:
            choice = input().lower()
            if choice == 'y':
                test_serial_connection(detected_port)
        except KeyboardInterrupt:
            print("\n\n👋 Exiting...")
    else:
        print("\n❌ No ports available to test")
    
    print("\n" + "=" * 60)
    print("📚 Next Steps:")
    print("   1. Update SERIAL_PORT in api.py with the detected port")
    print("   2. Upload arduino_sensor_sketch.ino to your Arduino")
    print("   3. Run: python api.py")
    print("=" * 60)
