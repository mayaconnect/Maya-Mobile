require 'spaceship'

api_key = Spaceship::ConnectAPI::Key.create(
  key_id: "77TBY8NS79",
  issuer_id: "5a1bb2ff-02b3-4d58-b9d9-ab4639893fba",
  filepath: "./AuthKey_77TBY8NS79.p8"
)

Spaceship::ConnectAPI.token = api_key.create_token

begin
  apps = Spaceship::ConnectAPI::App.all
  puts "✅ Authentification réussie!"
  puts "Applications trouvées:"
  apps.each { |app| puts "  - #{app.name} (#{app.bundle_id})" }
rescue => e
  puts "❌ Échec d'authentification: #{e.message}"
end
