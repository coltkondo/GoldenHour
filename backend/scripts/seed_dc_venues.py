"""
Seed database with initial DC venues and deals.
Run with: python -m scripts.seed_dc_venues
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.venue import Venue
from app.models.deal import Deal
from app.models.happy_hour import HappyHourSchedule

from datetime import time

def seed_venues_and_deals():
    db: Session = SessionLocal()
    
    try:
        print("🌱 Seeding DC venues and deals...")
        
        # Sample DC venues with real data
        venues_data = [
            {
                "name": "The Brixton",
                "address": "901 U St NW, Washington, DC 20001",
                "latitude": 38.9169,
                "longitude": -77.0251,
                "neighborhood": "U Street",
                "venue_type": "bar",
                "phone": "(202) 560-5045",
                "description": "British-inspired pub with rooftop",
                "deals": [
                    {
                        "title": "$5 Rail Drinks",
                        "description": "Well drinks and house wine",
                        "category": "drinks",
                        "deal_type": "special_price",
                        "deal_price": 5.00,
                        "items": ["Well drinks", "House wine"],
                        "schedules": [
                            {"day": 0, "start": "16:00", "end": "19:00"},  # Monday
                            {"day": 1, "start": "16:00", "end": "19:00"},  # Tuesday
                            {"day": 2, "start": "16:00", "end": "19:00"},  # Wednesday
                            {"day": 3, "start": "16:00", "end": "19:00"},  # Thursday
                            {"day": 4, "start": "16:00", "end": "19:00"},  # Friday
                        ]
                    }
                ]
            },
            {
                "name": "Jack Rose Dining Saloon",
                "address": "2007 18th St NW, Washington, DC 20009",
                "latitude": 38.9178,
                "longitude": -77.0415,
                "neighborhood": "Adams Morgan",
                "venue_type": "bar",
                "phone": "(202) 588-7388",
                "description": "Upscale whiskey bar with extensive collection",
                "deals": [
                    {
                        "title": "$6 Select Cocktails",
                        "description": "Classic cocktails during happy hour",
                        "category": "drinks",
                        "deal_type": "special_price",
                        "deal_price": 6.00,
                        "items": ["Old Fashioned", "Manhattan", "Daiquiri"],
                        "schedules": [
                            {"day": i, "start": "17:00", "end": "19:00"} for i in range(5)
                        ]
                    }
                ]
            },
            {
                "name": "Busboys and Poets - 14th & V",
                "address": "2021 14th St NW, Washington, DC 20009",
                "latitude": 38.9177,
                "longitude": -77.0319,
                "neighborhood": "U Street",
                "venue_type": "restaurant",
                "phone": "(202) 387-7638",
                "description": "Restaurant, bookstore, and cultural hub",
                "deals": [
                    {
                        "title": "Half-Price Appetizers",
                        "description": "50% off select appetizers",
                        "category": "food",
                        "deal_type": "discount",
                        "discount_percentage": 50.0,
                        "items": ["Wings", "Hummus", "Spring rolls"],
                        "schedules": [
                            {"day": i, "start": "16:00", "end": "18:30"} for i in range(5)
                        ]
                    }
                ]
            },
            {
                "name": "Nellie's Sports Bar",
                "address": "900 U St NW, Washington, DC 20001",
                "latitude": 38.9169,
                "longitude": -77.0249,
                "neighborhood": "U Street",
                "venue_type": "bar",
                "phone": "(202) 332-6355",
                "description": "LGBTQ+ sports bar with rooftop",
                "deals": [
                    {
                        "title": "$4 Bud Light Drafts",
                        "description": "Domestic beer specials",
                        "category": "drinks",
                        "deal_type": "special_price",
                        "deal_price": 4.00,
                        "items": ["Bud Light", "Miller Lite"],
                        "schedules": [
                            {"day": i, "start": "16:00", "end": "20:00"} for i in range(7)
                        ]
                    }
                ]
            },
            {
                "name": "Columbia Room",
                "address": "124 Blagden Alley NW, Washington, DC 20001",
                "latitude": 38.9076,
                "longitude": -77.0219,
                "neighborhood": "Shaw",
                "venue_type": "bar",
                "phone": "(202) 316-9396",
                "description": "Acclaimed cocktail bar with tasting room",
                "deals": [
                    {
                        "title": "$8 Classic Cocktails",
                        "description": "Punch room classics",
                        "category": "drinks",
                        "deal_type": "special_price",
                        "deal_price": 8.00,
                        "items": ["Negroni", "Martini", "Gimlet"],
                        "schedules": [
                            {"day": i, "start": "17:00", "end": "19:00"} for i in range(5)
                        ]
                    }
                ]
            }
        ]
        
        for venue_data in venues_data:
            # Extract deals before creating venue
            deals_data = venue_data.pop("deals", [])
            
            # Create venue
            
            venue = Venue(**venue_data,  verified=True)
            db.add(venue)
            db.flush()  # Get venue ID without committing
            
            print(f"✅ Created venue: {venue.name}")
            
            # Create deals and schedules
            for deal_data in deals_data:
                schedules_data = deal_data.pop("schedules", [])
                
                deal = Deal(
                    **deal_data,
                    venue_id=venue.id,
                    verified=True
                )
                db.add(deal)
                db.flush()
                
                print(f"  💰 Created deal: {deal.title}")
                
                # Create schedules
                for schedule_data in schedules_data:
                    start_time = time.fromisoformat(schedule_data["start"])
                    end_time = time.fromisoformat(schedule_data["end"])
                    
                    schedule = HappyHourSchedule(
                        venue_id=venue.id,
                        day_of_week=schedule_data["day"],
                        start_time=start_time,
                        end_time=end_time,
                        deal_ids=[deal.id]
                    )
                    db.add(schedule)
                
                print(f"    📅 Created {len(schedules_data)} schedules")
        
        db.commit()
        print(f"\n🎉 Successfully seeded {len(venues_data)} venues!")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_venues_and_deals()
