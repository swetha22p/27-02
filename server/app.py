from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# MongoDB configuration
app.config['MONGO_URI'] = 'mongodb://localhost:27017/phcp_formdata'
mongo = PyMongo(app)

# Check if connected to MongoDB
if mongo.db:
    print("Connected to MongoDB successfully.")
else:
    print("Failed to connect to MongoDB.")

# Endpoint to handle form data submission
@app.route('/api/save-data', methods=['POST'])
def save_data():
    try:
        data = request.json  # Get form data from request
        # Validate and process the data as needed
        # For example, you can insert it into MongoDB
        inserted_data = mongo.db.collection_name.insert_one(data)
        # Respond with success message
        return jsonify({'message': 'Data saved successfully', 'inserted_id': str(inserted_data.inserted_id)}), 200
    except Exception as e:
        # Handle exceptions and respond with error message
        return jsonify({'error': str(e)}), 500
    

@app.route('/api/get-data', methods=['GET'])
def get_all_data():
    try:
        # Query MongoDB to retrieve all form data
        form_data = list(mongo.db.collection_name.find({}, {'_id': 0}))
        # Return form data as JSON response
        return jsonify(form_data), 200
    except Exception as e:
        # Handle exceptions and respond with error message
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)







