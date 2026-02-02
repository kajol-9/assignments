# praking_lot->multiple levels->level->certain no. of plots
# plots(unique vechile accomdatiom )->different types

class vehicle:
    def __init__(self,vehicle_type,plate_number):
        self.vehicle_type = vehicle_type
        self.plate_number = plate_number

class car(vehicle):
        def __init__(self,plate_number):
            super().__init__("car",plate_number)

    
class bike(vehicle):
        def __init__(self,plate_number):
            super().__init__("bike",plate_number)

class truck(vehicle):
        def __init__(self,plate_number):
            super().__init__("truck",plate_number)


class parking_lot:
      def __init__(self,lot_type):
            self.lot_type = lot_type
            self.vehicle = None

    #avaliability,canfit,park,remove

      def is_available(self):
            
            return self.vehicle is None
      
      def park(self,vehicle):
            self.vehicle = vehicle

      def remove(self,vehicle):
            self.vehicle = None

      def can_vehicle_fit(self,vehicle):
            can_park = {
                  "car" : ["medium","large"],
                  "truck" : ["small","medium","large"],
                  "bike" : ["small"]

            }
            return self.lot_type in can_park[vehicle.vehicle_type]
      
class parking_lot_level:
      def __init__(self,level_no,parking_lots):
            self.level_no = level_no
            self.parking_lots = parking_lots
            
            
      def find_lot(self,vehicle):
            for lot in self.parking_lots:
                  if lot.is_available() and lot.can_vehicle_fit(vehicle):
                        return lot
            return None
      def total_available_lots(self):
            return sum(1 for lot in self.parking_lots if lot.is_available())      
      

class Mainparking_lot:
      def __init__(self,levels):
            self.levels = levels

      def park_vehicle(self,vehicle):
            for level in self.levels:
                  lot = level.find_lot(vehicle)
                  if lot:
                        lot.park(vehicle)
                        print(f"{vehicle.vehicle_type} is parked at level {level.level_no}")
                        return True
            print("No parking lot available")
            return False
      def exit_vehicle(self,plate_number):
            for level in self.levels:
                  for lot in level.parking_lots:
                        if lot.vehicle and lot.vehicle.plate_number == plate_number:
                              lot.remove(lot.vehicle)
                              print(f"vehicle {plate_number} exited from level {level.level_no}")
                              return True
            print("Vehicle not found")
            return False
      
      def display_availability(self):
            for level in self.levels:
                  print(f"level {level.level_no} available spots: {level.total_available_lots()}")


# Create and initialize objects
if __name__ == "__main__":
      # Create vehicles
      car1 = car("CAR-001")
      car2 = car("CAR-002")
      bike1 = bike("BIKE-001")
      truck1 = truck("TRUCK-001")
      
      # Create parking lots for level 1
      level1_lots = [
            parking_lot("small"),
            parking_lot("small"),
            parking_lot("medium"),
            parking_lot("medium"),
            parking_lot("large")
      ]
      
      # Create parking lots for level 2
      level2_lots = [
            parking_lot("medium"),
            parking_lot("medium"),
            parking_lot("large"),
            parking_lot("large"),
            parking_lot("large")
      ]
      
      # Create parking levels
      level1 = parking_lot_level(1, level1_lots)
      level2 = parking_lot_level(2, level2_lots)
      
      # Create main parking lot
      main_parking = Mainparking_lot([level1, level2])
      
      # Display initial availability
      print("=== Initial Parking Availability ===")
      main_parking.display_availability()
      
      # Park vehicles
      print("\n=== Parking Vehicles ===")
      main_parking.park_vehicle(car1)
      main_parking.park_vehicle(bike1)
      main_parking.park_vehicle(car2)
      main_parking.park_vehicle(truck1)
      
      # Display availability after parking
      print("\n=== Parking Availability After Parking ===")
      main_parking.display_availability()
      
      # Exit vehicle
      print("\n=== Exiting Vehicle ===")
      main_parking.exit_vehicle("CAR-001")
      
      # Display final availability
      print("\n=== Final Parking Availability ===")
      main_parking.display_availability()



