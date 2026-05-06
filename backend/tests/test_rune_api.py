"""
Backend API tests for Rune Divination App
Tests: /api/draw, /api/readings (POST, GET, DELETE)
"""
import pytest
import requests
import os

# Use the public URL for testing
BASE_URL = "https://rune-divination-1.preview.emergentagent.com"

class TestRuneAPI:
    """Test rune drawing and readings endpoints"""

    def test_health_check(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data

    def test_get_all_runes(self):
        """Test GET /api/runes returns 25 runes"""
        response = requests.get(f"{BASE_URL}/api/runes")
        assert response.status_code == 200
        runes = response.json()
        assert len(runes) == 25
        # Check blank rune exists
        blank_rune = next((r for r in runes if r["id"] == "blank"), None)
        assert blank_rune is not None
        assert blank_rune["name_en"] == "Wyrd (Blank Rune)"

    def test_draw_rune(self):
        """Test POST /api/draw returns random rune with position"""
        response = requests.post(f"{BASE_URL}/api/draw")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "rune_id" in data
        assert "position" in data
        assert "symbol" in data
        assert "name" in data
        assert "meaning" in data
        assert "interpretation" in data
        
        # Verify position is valid
        assert data["position"] in ["upright", "reversed"]
        
        # Verify interpretation is not empty
        assert len(data["interpretation"]) > 0

    def test_draw_multiple_runes_randomness(self):
        """Test that drawing multiple times gives different results"""
        results = []
        for _ in range(5):
            response = requests.post(f"{BASE_URL}/api/draw")
            assert response.status_code == 200
            data = response.json()
            results.append(data["rune_id"])
        
        # At least one should be different (very high probability)
        assert len(set(results)) > 1, "Drawing 5 times should give at least some variety"

    def test_save_reading_and_verify(self):
        """Test POST /api/readings saves reading and GET verifies it"""
        # First draw a rune
        draw_response = requests.post(f"{BASE_URL}/api/draw")
        assert draw_response.status_code == 200
        draw_data = draw_response.json()
        
        # Save the reading
        save_payload = {
            "rune_id": draw_data["rune_id"],
            "position": draw_data["position"]
        }
        save_response = requests.post(
            f"{BASE_URL}/api/readings",
            json=save_payload,
            headers={"Content-Type": "application/json"}
        )
        assert save_response.status_code == 200
        saved_reading = save_response.json()
        
        # Verify saved reading structure
        assert "id" in saved_reading
        assert saved_reading["rune_id"] == draw_data["rune_id"]
        assert saved_reading["position"] == draw_data["position"]
        assert "rune_symbol" in saved_reading
        assert "rune_name" in saved_reading
        assert "rune_meaning" in saved_reading
        assert "interpretation" in saved_reading
        assert "timestamp" in saved_reading
        
        # Verify no MongoDB _id in response
        assert "_id" not in saved_reading
        
        # GET to verify persistence
        get_response = requests.get(f"{BASE_URL}/api/readings")
        assert get_response.status_code == 200
        readings = get_response.json()
        
        # Find our saved reading
        found = any(r["id"] == saved_reading["id"] for r in readings)
        assert found, "Saved reading should be in GET /api/readings response"

    def test_get_readings_empty(self):
        """Test GET /api/readings when no readings exist"""
        # Clear all readings first
        requests.delete(f"{BASE_URL}/api/readings")
        
        response = requests.get(f"{BASE_URL}/api/readings")
        assert response.status_code == 200
        readings = response.json()
        assert isinstance(readings, list)
        assert len(readings) == 0

    def test_get_readings_sorted_by_timestamp(self):
        """Test GET /api/readings returns readings sorted by timestamp (newest first)"""
        # Clear existing readings
        requests.delete(f"{BASE_URL}/api/readings")
        
        # Create multiple readings
        for i in range(3):
            draw_response = requests.post(f"{BASE_URL}/api/draw")
            draw_data = draw_response.json()
            requests.post(
                f"{BASE_URL}/api/readings",
                json={"rune_id": draw_data["rune_id"], "position": draw_data["position"]},
                headers={"Content-Type": "application/json"}
            )
        
        # Get readings
        response = requests.get(f"{BASE_URL}/api/readings")
        assert response.status_code == 200
        readings = response.json()
        assert len(readings) == 3
        
        # Verify sorted by timestamp (newest first)
        timestamps = [r["timestamp"] for r in readings]
        assert timestamps == sorted(timestamps, reverse=True), "Readings should be sorted newest first"

    def test_clear_readings(self):
        """Test DELETE /api/readings clears all history"""
        # Create a reading first
        draw_response = requests.post(f"{BASE_URL}/api/draw")
        draw_data = draw_response.json()
        requests.post(
            f"{BASE_URL}/api/readings",
            json={"rune_id": draw_data["rune_id"], "position": draw_data["position"]},
            headers={"Content-Type": "application/json"}
        )
        
        # Verify reading exists
        get_response = requests.get(f"{BASE_URL}/api/readings")
        assert len(get_response.json()) > 0
        
        # Clear all readings
        delete_response = requests.delete(f"{BASE_URL}/api/readings")
        assert delete_response.status_code == 200
        data = delete_response.json()
        assert "message" in data
        
        # Verify readings are cleared
        get_response = requests.get(f"{BASE_URL}/api/readings")
        assert get_response.status_code == 200
        readings = get_response.json()
        assert len(readings) == 0

    def test_save_reading_invalid_rune_id(self):
        """Test POST /api/readings with invalid rune_id"""
        save_payload = {
            "rune_id": "invalid_rune_id_12345",
            "position": "upright"
        }
        save_response = requests.post(
            f"{BASE_URL}/api/readings",
            json=save_payload,
            headers={"Content-Type": "application/json"}
        )
        # Should still return 200 but with error in response
        assert save_response.status_code == 200
        data = save_response.json()
        assert "error" in data

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session
