RSpec.configure do |config|
  config.before :suite do
    # github actionsで意図せず設定されるのでENVから削除する
    ENV.delete('GITHUB_REPOSITORY')
  end
end
