class Rack::Attack
  ### Throttle Spammy Clients ###
  throttle("req/ip", limit: 300, period: 1.minutes) do |req|
    req.ip unless req.path.first(9) == "/api/rmq/"
  end

  # ### Stop people from overusing the sync object. ###
  throttle("sync_req/ip", limit: 15, period: 1.minutes) do |req|
    req.ip if req.url.include?("api/device/sync")
  end

  ### Don't allow too many demo account requests ###
  throttle("demo_accounts/ip", limit: 10, period: 10.minutes) do |req|
    req.ip if req.path.downcase == "/demo"
  end

  throttle("password_resets/ip", limit: 3, period: 1.hour) do |req|
    req.ip if req.path.downcase == "api/password_resets"
  end
end

# Always allow requests from localhost
# (blacklist & throttles are skipped)
Rack::Attack.safelist("allow from localhost") do |req|
  # Requests are allowed if the return value is truthy
  "127.0.0.1" == req.ip || "::1" == req.ip
end

ActiveSupport::Notifications.subscribe("rack.attack") do |_n, _s, _f, _r, req|
  req = req[:request]
  if %i[throttle blocklist].include?(req.env["rack.attack.match_type"])
    puts("BLOCKED BY RACK ATTACK: #{req.ip} => #{req.url}")
  end
end
