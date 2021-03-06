require_relative "../../app/lib/key_gen"

class NewUserReport
  EMAILS = (ENV["CUSTOMER_SUPPORT_SUBSCRIBERS"] || "").split(",").map(&:strip).map(&:trim)
  TPL = <<~HEREDOC
    Below is a list of new installations that need a support check-in:

    === New device installations today:
    %{daily}

    === New Device installations this week:
    %{weekly}
  HEREDOC

  def new_today
    @new_today ||= User
      .joins(:device)
      .where("devices.first_saw_api > ?", 1.day.ago)
      .pluck(:email)
      .sort
  end

  def new_this_week
    @new_this_week ||= User
      .joins(:device)
      .where("devices.first_saw_api > ?", 7.days.ago)
      .where
      .not(email: new_today)
      .pluck(:email)
      .sort
  end

  def message
    @message ||= TPL % {
      weekly: new_this_week.join("\n"),
      daily: new_today.join("\n"),
    }
  end

  def deliver
    puts message
    ActionMailer::Base.mail(
      from: "do-not-reply@farmbot.io",
      to: EMAILS,
      subject: "Daily Report: New FarmBot Setups",
      body: message,
    ).deliver
  end
end

namespace :new_user_report do
  desc "Send email to customer support with new users for the week / day."
  task run: :environment do
    report = NewUserReport.new
    report.deliver
  end
end
