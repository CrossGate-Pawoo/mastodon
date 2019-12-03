threads_count = ENV.fetch('MAX_THREADS') { 5 }.to_i
threads threads_count, threads_count

if ENV['SOCKET'] then
  bind 'unix://' + ENV['SOCKET']
else
  port ENV.fetch('PORT') { 3000 }
end

environment ENV.fetch('RAILS_ENV') { 'development' }
workers     ENV.fetch('WEB_CONCURRENCY') { 2 }

app_root = File.expand_path('../../', __FILE__)
stdout_redirect(nil, "#{app_root}/log/puma_stderr", true)

preload_app!

on_worker_boot do
  ActiveRecord::Base.establish_connection if defined?(ActiveRecord)
end

before_fork do
  require 'puma_worker_killer'

  PumaWorkerKiller.config do |config|
    config.ram = ENV.fetch('WEB_CONCURRENCY') { 2 }.to_i * (ENV['PAWOO_PUMA_MAX_RAM_PER_WORKER'] || 512).to_i # mb
    config.rolling_restart_frequency = false
  end

  PumaWorkerKiller.start
end

plugin :tmp_restart
